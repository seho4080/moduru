from fastapi import FastAPI, Body
from pydantic import BaseModel
import modules.services as services

app = FastAPI()


# NOTE: 데이터 검증을 위한 데이터 모델 정의
class Place(BaseModel):
    id: int
    category_id: int
    lat: float
    lng: float


class ScheduleRequest(BaseModel):
    place_list: list[Place]
    days: int


@app.post("/recommend/places")
def get_place_recommendations(region_id: int = Body(...), query: str = Body(...)):
    return services.recommend_places(region_id, query)


# TODO: Implement the schedule recommendation endpoint
@app.post("/recommend/schedule")
def get_schedule_recommendation(request: ScheduleRequest):
    place_list = [p.model_dump() for p in request.place_list]
    days = request.days
    final_data = []

    days_list = services.k_means_clustering(place_list, days)

    for day, day_list in enumerate(days_list, 1):
        if len(day_list["points"]) == 1:
            final_data.append(
                {
                    "day": day,
                    "route": {
                        "transport": None,
                        "id": day_list["points"][0]["id"],
                        "eventOrder": 1,
                        "nextTravelTime": None,
                    },
                }
            )
        else:
            final_data.append(
                {
                    "day": day,
                    "route": services.recommend_route(day_list["points"])["route"],
                }
            )
    return final_data


# TODO: Implement the route recommendation endpoint
@app.post("/recommend/route")
def recommend_route_api(request: ScheduleRequest):
    place_list = [p.model_dump() for p in request.place_list]
    result = {
        "day": request.days,
        "route": services.recommend_route(place_list)["route"],
    }
    return result


if __name__ == "__main__":
    # pass
    place_list = [
        {"id": 33, "category_id": 1, "lat": 37.5248158876489, "lng": 127.127421779545},
        {"id": 34, "category_id": 1, "lat": 37.57446722947599, "lng": 126.9835539937142},
        {"id": 35, "category_id": 1, "lat": 37.5416425400595, "lng": 126.987111931514},
        {"id": 36, "category_id": 1, "lat": 37.5620930224303, "lng": 126.973922542381},
        {"id": 37, "category_id": 1, "lat": 37.5774769385374, "lng": 126.967908167278},
        {"id": 38, "category_id": 2, "lat": 37.482562590959, "lng": 127.000144721068},
        {"id": 39, "category_id": 2, "lat": 37.51233177478449, "lng": 126.99588851601666},
        {"id": 40, "category_id": 2, "lat": 37.5113551338727, "lng": 126.997629282491},
        {"id": 41, "category_id": 2, "lat": 37.5077328948993, "lng": 126.992725325294},
        {"id": 42, "category_id": 3, "lat": 37.5716228232824, "lng": 126.976787992565},
        {"id": 43, "category_id": 3, "lat": 37.5734304140493, "lng": 126.975960388222},
        {"id": 44, "category_id": 3, "lat": 37.566370776634, "lng": 126.977918351844},
        {"id": 45, "category_id": 3, "lat": 37.5282197824835, "lng": 126.832145349117},
    ]
    day = 3

    final_data = {
        "transport": "car",
        "day": day,
        "route": services.recommend_route(place_list)["route"],
    }
    print(final_data)