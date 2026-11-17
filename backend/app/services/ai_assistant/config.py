import os

# Centralized environment configurations for the AI Financial Assistant
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
AI_ASSISTANT_MODEL = os.environ.get("AI_ASSISTANT_MODEL", "gpt-4o-mini")
AI_MAX_OUTPUT_TOKENS = int(os.environ.get("AI_MAX_OUTPUT_TOKENS", "800"))
MAX_MESSAGE_CHARACTERS = int(os.environ.get("MAX_MESSAGE_CHARACTERS", "2000"))
