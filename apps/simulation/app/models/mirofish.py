from pydantic import BaseModel
from typing import Optional

class MiroFishJob(BaseModel):
    simulation_id: str
    user_id: str
    seed_context: str
    steps: Optional[int] = 24
