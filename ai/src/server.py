from fastapi import FastAPI, Query
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


def k_means_clustering(data, days):
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
    # NOTE: 데이터 세팅
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
    search_parameters.time_limit.seconds = 10  # 최대 10초 제한

    # NOTE: 문제 풀기
    solution = routing.SolveWithParameters(search_parameters)

    if solution:
        # NOTE: 결과 경로와 총 시간 추출
        index = routing.Start(0)
        plan = []
        total_time = 0
        while not routing.IsEnd(index):
            plan.append(manager.IndexToNode(index))
            previous_index = index
            index = solution.Value(routing.NextVar(index))
            total_time += routing.GetArcCostForVehicle(previous_index, index, 0)
        plan.append(manager.IndexToNode(index))

        return plan, total_time
    else:
        return None, None


def recommend_route(data):
    routes_time = kakao.get_routes_time(data)
    print(routes_time)
    time_matrix = []
    for i in range(len(routes_time)):
        matrix = []
        for j in range(len(routes_time)):
            if i > j:
                matrix.append(routes_time[i]["destinations"][j]["duration"])
            elif i == j:
                matrix.append(0)
            elif i < j:
                matrix.append(routes_time[i]["destinations"][j - 1]["duration"])
        time_matrix.append(matrix)

    print("Time Matrix:", time_matrix)
    route, total_time = solve_tsp(time_matrix)
    return route


@app.get("/recommend/places")
def get_recommendations(region_id: int = Query(...), query: str = Query(...)):
    return recommend_places(region_id, query)


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
    print(recommend_route(place_list))
