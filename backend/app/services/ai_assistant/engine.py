import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from openai import OpenAI

from app.models.user import User
from app.models.loan import Loan
from app.schemas.ai_assistant import ChatResponse, FinancialValue
from app.services.ai_assistant import config
from app.services.ai_assistant.guardrails import (
    validate_and_sanitize_message,
    enforce_response_guardrails,
    FIXED_DISCLAIMER
)
from app.services.ai_assistant.intent import (
    classify_intent_deterministically,
    extract_scenario_parameters_with_llm
)
from app.services.ai_assistant.context_builder import build_user_financial_context
from app.services.ai_assistant.prompts import SYSTEM_PROMPT
from app.services.financial_simulator.engine import run_simulation

def generate_fallback_response(intent: str, message: str) -> ChatResponse:
    """
    Returns a safe structured fallback response.
    """
    return ChatResponse(
        answer="I couldn't generate a reliable explanation right now. Please try again.",
        intent=intent,
        key_points=[],
        financial_values=[],
        disclaimer=FIXED_DISCLAIMER
    )

def run_chat_assistant(db: Session, user: User, message: str) -> ChatResponse:
    """
    Main orchestrator for the AI Financial Assistant query.
    1. Sanitizes inputs.
    2. Determines intent.
    3. Runs Step 10 simulation if intent is what-if.
    4. Gathers relevant context from backend services.
    5. Calls OpenAI API with structured response requirements.
    6. Performs validations and schema checks.
    """
    # Step 1: Input validations
    try:
        validate_and_sanitize_message(message)
    except ValueError as val_err:
        # Re-raise to let API router return 422
        raise val_err

    # Check for missing API Key and fail gracefully
    if not config.OPENAI_API_KEY:
        return ChatResponse(
            answer="AI Financial Assistant is currently unavailable.",
            intent="general_financial_question",
            key_points=[],
            financial_values=[],
            disclaimer=FIXED_DISCLAIMER
        )

    # Step 2: Classify Intent
    intent = classify_intent_deterministically(message)

    # If the user query is completely out of bounds
    if intent == "unsupported_request":
        return ChatResponse(
            answer="I'm designed to help with your financial planning, budgeting, goals and investment allocation. I can't help with that request.",
            intent="unsupported_request",
            key_points=[],
            financial_values=[],
            disclaimer=FIXED_DISCLAIMER
        )

    # Initialize client
    try:
        client = OpenAI(api_key=config.OPENAI_API_KEY)
    except Exception as e:
        print(f"Error initializing OpenAI client: {e}")
        return generate_fallback_response(intent, "AI assistant setup error.")

    # Step 3: What-If simulation delegation
    simulation_result = None
    scen_type = None
    if intent == "what_if":
        # Extract parameters using a lightweight LLM call
        extracted = extract_scenario_parameters_with_llm(message, client, config.AI_ASSISTANT_MODEL)
        if not extracted:
            return ChatResponse(
                answer="I couldn't clarify the simulation parameters from your question. Could you specify your hypothetical changes (e.g. salary to ₹60,000, or reducing eating outside to ₹2,000) more clearly?",
                intent="what_if",
                key_points=[],
                financial_values=[],
                disclaimer=FIXED_DISCLAIMER
            )

        scen_type = extracted["scenario_type"]
        scen_data = extracted["scenario_data"]

        # Resolve loan_type to active loan_id
        if scen_type == "loan_change" and "loan_type" in scen_data:
            loan_type = scen_data["loan_type"]
            # Find user's active loan matching this type
            user_loan = db.query(Loan).filter(
                Loan.user_id == user.id,
                Loan.loan_type.ilike(f"%{loan_type}%")
            ).first()
            if user_loan:
                scen_data["loan_id"] = user_loan.id
            else:
                return ChatResponse(
                    answer=f"I couldn't find an active '{loan_type}' in your profile to run a simulation.",
                    intent="what_if",
                    key_points=[],
                    financial_values=[],
                    disclaimer=FIXED_DISCLAIMER
                )

        try:
            # Trigger Step 10 deterministic simulator
            simulation_result = run_simulation(
                db=db,
                user=user,
                scenario_type=scen_type,
                scenario_data=scen_data
            )
        except Exception as sim_err:
            print(f"Simulation execution failed: {sim_err}")
            return ChatResponse(
                answer=f"I couldn't run that simulation: {str(sim_err)}",
                intent="what_if",
                key_points=[],
                financial_values=[],
                disclaimer=FIXED_DISCLAIMER
            )

    # Step 4: Gather structured context
    context = build_user_financial_context(db, user, intent, simulation_result, scen_type)

    # Step 5: OpenAI Completion request
    try:
        completion = client.chat.completions.create(
            model=config.AI_ASSISTANT_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Structured Context:\n{context}\n\nUser Question:\n{message}"}
            ],
            response_format={"type": "json_object"},
            max_tokens=config.AI_MAX_OUTPUT_TOKENS,
            timeout=15.0
        )
        response_text = completion.choices[0].message.content
        response_dict = json.loads(response_text)
        
        # Step 6: Guardrails check & validation
        chat_response = enforce_response_guardrails(response_dict)
        return chat_response

    except Exception as e:
        print(f"API request or response validation failed: {e}")
        return generate_fallback_response(intent, message)
