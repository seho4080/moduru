from fastapi import FastAPI, Request
from pydantic import BaseModel
import ai

app = FastAPI()


class PlaceRecommendationRequest(BaseModel):
    region_code: int
    query: str


class ScheduleRecommendationRequest(BaseModel):
    region_code: int
    query: str


class RouteRecommendationRequest(BaseModel):
    region_code: int
    query: str


@app.post("/recommend/places")
def recommend_places(req: PlaceRecommendationRequest):
    try:
        results = ai.recommend_places(req.region_code, req.query)
        return {"status": "success", "results": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}
