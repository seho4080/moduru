from fastapi import FastAPI, Body
from pydantic import BaseModel
import modules.gms_api as gms
import modules.kakao_maps_api as kakao
import modules.utils as utils


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
    return utils.recommend_places(region_id, query)


# TODO: Implement the schedule recommendation endpoint
@app.post("/recommend/schedule")
def get_schedule_recommendation(request: ScheduleRequest):
    place_list = [p.model_dump() for p in request.place_list]
    days = request.days
    final_data = []

    days_list = utils.k_means_clustering(place_list, days)

    for day, day_list in enumerate(days_list, 1):
        final_data.append(
            {
                "transport": "car",
                "day": day,
                "route": utils.recommend_route(day_list["points"])["route"],
            }
        )
    return final_data


# TODO: Implement the route recommendation endpoint
@app.post("/recommend/route")
def recommend_route_api(request: ScheduleRequest):
    place_list = [p.model_dump() for p in request.place_list]
    result = {
        "transport": "car",
        "day": request.days,
        "route": utils.recommend_route(place_list)["route"],
    }
    return result


if __name__ == "__main__":
    pass
    # place_list = [
    #     {"id": 400, "category_id": 1, "lat": 36.3447753226941, "lng": 127.433183296499},
    #     {"id": 1551, "category_id": 2, "lat": 36.3668725417191, "lng": 127.385713083518},
    #     {"id": 1546, "category_id": 2, "lat": 36.3234673989231, "lng": 127.424285321913},
    #     {"id": 653, "category_id": 3, "lat": 36.376625791745, "lng": 127.38720183152},
    #     {"id": 3305, "category_id": 1, "lat": 36.3349680255062, "lng": 127.336580105071},
    #     {"id": 3608, "category_id": 2, "lat": 36.345984114769, "lng": 127.456106584105},
    #     {"id": 3729, "category_id": 2, "lat": 36.3471971249462, "lng": 127.457512826102},
    # ]
    # day = 2

    # final_data = {
    #     "transport": "car",
    #     "day": day,
    #     "route": utils.recommend_route(place_list)["route"],
    # }
    # print(final_data)
