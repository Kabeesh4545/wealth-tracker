from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any
from app.services.market_trends import get_market_trends_data
import logging

logger = logging.getLogger("money_management.market_trends_router")

router = APIRouter(
    prefix="/api/market",
    tags=["Market Trends & Stock Intelligence"]
)

@router.get("/trends", response_model=None)
async def get_market_trends() -> Dict[str, Any]:
    """
    24/7 endpoint delivering real-time and closing market trends,
    major Indian indices (Nifty 50, Sensex, Bank Nifty), precious metals (Gold, Silver),
    and top bluechip stocks with trend direction and investment guidance.
    """
    try:
        data = await get_market_trends_data()
        return data
    except Exception as exc:
        logger.error(f"Failed to fetch market trends: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving market trends data"
        )
