from fastapi import FastAPI, Body
from pydantic import BaseModel
import modules.gms_api as gms
import modules.kakao_maps_api as kakao
import modules.utils as utils
from sklearn.cluster import KMeans
from ortools.constraint_solver import pywrapcp, routing_enums_pb2

app = FastAPI()


def recommend_places(region_id, query):
    if not query:
        return {"error": "Query cannot be empty."}
    if not region_id:
        return {"error": "Region ID cannot be empty."}
    if region_id <= 0 or region_id > 17:
        return {"error": "Invalid Region ID."}

    query_embedding = gms.text_embedding(query)
    similar_places = utils.cosine_similarity(region_id, query_embedding)
    place_list = gms.filter_valid(similar_places, query)
    return {"result": place_list}


def recommend_schedule(data, days):
    if not data:
        print("No data provided for clustering.")
        return []
    if len(data) < days:
        print("Not enough data points for the number of days specified.")
        return []
    if not days or days <= 0:
        print("Invalid number of days for clustering.")
        return []

    coords = [(d["lat"], d["lng"]) for d in data]
    kmeans = KMeans(n_clusters=days, random_state=42, n_init=10)
    labels = kmeans.fit_predict(coords)

    clusters = {}
    for label, point in zip(labels, data):
        clusters.setdefault(label, []).append(point)

    return [{"cluster": label, "points": points} for label, points in clusters.items()]


def solve_tsp(time_matrix):
    num_nodes = len(time_matrix)
    manager = pywrapcp.RoutingIndexManager(num_nodes, 1, 0)  # 0번 노드 시작

    routing = pywrapcp.RoutingModel(manager)

    # NOTE: 이동 시간 계산 함수
    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return time_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(time_callback)

    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # NOTE: 탐색 파라미터 설정
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    search_parameters.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    search_parameters.time_limit.seconds = 5  # 최대 5초 제한

    # NOTE: 문제 풀기
    solution = routing.SolveWithParameters(search_parameters)

    if solution:
        # NOTE: 결과 경로와 총 시간 추출
        index = routing.Start(0)
        route = []
        total_time = 0
        while not routing.IsEnd(index):
            route.append(manager.IndexToNode(index))
            previous_index = index
            index = solution.Value(routing.NextVar(index))
            total_time += routing.GetArcCostForVehicle(previous_index, index, 0)
        route.append(manager.IndexToNode(index))

        return route, total_time
    else:
        return None, None


def recommend_route(data):
    routes_time = kakao.get_routes_time(data)
    place_ids = []
    time_matrix = []

    for i in range(len(routes_time)):
        place_ids.append(routes_time[i]["origin_id"])
        matrix = []
        for j in range(len(routes_time)):
            if i > j:
                matrix.append(routes_time[i]["destinations"][j]["duration"])
            elif i == j:
                matrix.append(0)
            elif i < j:
                matrix.append(routes_time[i]["destinations"][j - 1]["duration"])
        time_matrix.append(matrix)

    result = solve_tsp(time_matrix)

    # NOTE: 결과 백엔드로 보내기 위한 포맷팅
    formatted_route = {"route": []}
    for i in range(len(result[0]) - 1):
        start = result[0][i]
        end = result[0][i + 1]
        duration = time_matrix[start][end]

        # NOTE: 마지막 장소는 다음 이동 시간이 없으므로 None으로 설정
        if end == 0:
            formatted_route["route"].append(
                {
                    "id": place_ids[start],
                    "eventOrder": i + 1,
                    "nextTravelTime": None,
                }
            )
        else:
            formatted_route["route"].append(
                {
                    "id": place_ids[start],
                    "eventOrder": i + 1,
                    "nextTravelTime": duration,
                }
            )
    return formatted_route


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
    return recommend_places(region_id, query)


# TODO: Implement the schedule recommendation endpoint
@app.post("/recommend/schedule")
def get_schedule_recommendation(request: ScheduleRequest):
    place_list = [p.model_dump() for p in request.place_list]
    days = request.days
    final_data = []

    days_list = recommend_schedule(place_list, days)

    for day, day_list in enumerate(days_list, 1):
        final_data.append(
            {
                "transport": "car",
                "day": day,
                "route": recommend_route(day_list["points"])["route"],
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
        "route": recommend_route(place_list)["route"],
    }
    return result


if __name__ == "__main__":
    place_list = [
        {"id": 400, "category_id": 1, "lat": 36.3447753226941, "lng": 127.433183296499},
        {"id": 1551, "category_id": 2, "lat": 36.3668725417191, "lng": 127.385713083518},
        {"id": 1546, "category_id": 2, "lat": 36.3234673989231, "lng": 127.424285321913},
        {"id": 653, "category_id": 3, "lat": 36.376625791745, "lng": 127.38720183152},
        {"id": 3305, "category_id": 1, "lat": 36.3349680255062, "lng": 127.336580105071},
        {"id": 3608, "category_id": 2, "lat": 36.345984114769, "lng": 127.456106584105},
        {"id": 3729, "category_id": 2, "lat": 36.3471971249462, "lng": 127.457512826102},
    ]
    day = 2

    final_data = {
        "transport": "car",
        "day": day,
        "route": recommend_route(place_list)["route"],
    }
    print(final_data)
