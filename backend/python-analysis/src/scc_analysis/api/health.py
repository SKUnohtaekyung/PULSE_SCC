from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: Literal["scc-analysis"]


router = APIRouter(tags=["operations"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="scc-analysis")
