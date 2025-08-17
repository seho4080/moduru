import psycopg2
import numpy as np
from sklearn.cluster import KMeans
from ortools.constraint_solver import pywrapcp, routing_enums_pb2
import os
import modules.gms_api as gms
import modules.kakao_maps_api as kakao

conn = psycopg2.connect(
    host=os.getenv("POSTGRES_HOST", "localhost"),
    port=os.getenv("POSTGRES_PORT", 5432),
    dbname=os.getenv("POSTGRES_DB", "mydb"),
    user=os.getenv("POSTGRES_USER", "postgres"),
    password=os.getenv("POSTGRES_PASSWORD", "ssafy"),
)


def cosine_similarity(region_id, query_embedding):
    cur = conn.cursor()

    cur.execute(
        """SELECT
            p.id,
            p.place_name,
            p.address_name,
            COALESCE(r.business_hours, s.business_hours) AS business_hours,
            COALESCE(r.description, s.description, f.description) AS description
        FROM places p
        LEFT JOIN restaurants r ON p.id = r.place_id AND p.category_id = 1
        LEFT JOIN spots s       ON p.id = s.place_id AND p.category_id = 2
        LEFT JOIN festivals f   ON p.id = f.place_id AND p.category_id = 3
        WHERE p.region_id = %s
        ORDER BY p.embedding <#> %s::vector
        LIMIT 50
        """,
        (region_id, query_embedding),
    )

    results = cur.fetchall()
    return results


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

    coords = np.array([(d["lat"], d["lng"]) for d in data])
    n_points = len(data)

    kmeans = KMeans(n_clusters=days, random_state=42, n_init=10)
    labels = kmeans.fit_predict(coords)
    centroids = kmeans.cluster_centers_

    target_size = n_points // days
    if n_points % days != 0:
        target_size += 1

    for _ in range(5):
        cluster_counts = np.bincount(labels, minlength=days)
        overpopulated_clusters = [i for i, count in enumerate(cluster_counts) if count > target_size]
        underpopulated_clusters = [i for i, count in enumerate(cluster_counts) if count < target_size]

        if not overpopulated_clusters:
            break

        moved_count = 0
        for over_cluster in overpopulated_clusters:
            over_indices = np.where(labels == over_cluster)[0]

            distances_from_center = np.linalg.norm(coords[over_indices] - centroids[over_cluster], axis=1)
            sorted_by_distance = over_indices[np.argsort(distances_from_center)[::-1]]

            for point_idx in sorted_by_distance:
                if cluster_counts[over_cluster] <= target_size:
                    break

                if not underpopulated_clusters:
                    break

                min_dist = float("inf")
                closest_under_cluster = -1

                for under_cluster in underpopulated_clusters:
                    dist = np.linalg.norm(coords[point_idx] - centroids[under_cluster])
                    if dist < min_dist:
                        min_dist = dist
                        closest_under_cluster = under_cluster

                if closest_under_cluster != -1:
                    labels[point_idx] = closest_under_cluster
                    cluster_counts[over_cluster] -= 1
                    cluster_counts[closest_under_cluster] += 1

                    if cluster_counts[closest_under_cluster] >= target_size:
                        underpopulated_clusters.remove(closest_under_cluster)

                    moved_count += 1

        if moved_count == 0:
            break

    clusters = {}
    for i, point in enumerate(data):
        clusters.setdefault(int(labels[i]), []).append(point)

    return [{"cluster": label, "points": points} for label, points in clusters.items()]


def recommend_places(region_id, query):
    if not query:
        return {"error": "Query cannot be empty."}
    try:
        region_id = int(region_id)  # "0" -> 0, " 12 " -> 12
    except (TypeError, ValueError):
        return {"error": "Region ID must be an integer."}
    if region_id < 0 or region_id > 167:
        return {"error": "Invalid Region ID."}

    query_embedding = gms.text_embedding(query)
    similar_places = cosine_similarity(region_id, query_embedding)
    place_list = gms.filter_valid(similar_places, query)
    return {"result": place_list}


def solve_tsp(time_matrix):
    """
    Solves the TSP for an open path (not returning to the start).
    It uses a dummy node to model the start and end of the path.
    """
    num_real_nodes = len(time_matrix)
    # Total nodes = real nodes + 1 dummy node for open path
    num_nodes = num_real_nodes + 1
    depot_index = num_real_nodes  # The dummy node is the last index

    manager = pywrapcp.RoutingIndexManager(num_nodes, 1, depot_index)
    routing = pywrapcp.RoutingModel(manager)

    # NOTE: 이동 시간 계산 함수 (Callback)
    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)

        # Cost from/to the dummy node is 0
        if from_node == depot_index or to_node == depot_index:
            return 0
        # Cost between real nodes
        return time_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(time_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # NOTE: 탐색 파라미터 설정
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    search_parameters.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    search_parameters.time_limit.seconds = 5

    # NOTE: 문제 풀기
    solution = routing.SolveWithParameters(search_parameters)

    if solution:
        index = routing.Start(0)
        route = []
        total_time = 0
        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            route.append(node)
            previous_index = index
            index = solution.Value(routing.NextVar(index))
            # Only add cost if moving between real nodes
            if manager.IndexToNode(previous_index) != depot_index and manager.IndexToNode(index) != depot_index:
                total_time += routing.GetArcCostForVehicle(previous_index, index, 0)

        # The raw route will start and end with the depot_index. We remove them.
        # e.g., [4, 1, 2, 0, 3, 4] -> [1, 2, 0, 3]
        optimized_path = [node for node in route if node != depot_index]

        return optimized_path, total_time
    else:
        return None, None


def recommend_route(data):
    """
    Generates a recommended route based on travel times and formats the output.
    """
    routes_time = kakao.get_routes_time(data)
    if not routes_time:
        return {"error": "Could not fetch route times."}

    place_ids = []
    time_matrix = []

    for i in range(len(routes_time)):
        place_ids.append(routes_time[i]["origin_id"])
        matrix_row = []
        destinations = routes_time[i]["destinations"]

        for j in range(len(routes_time)):
            if i > j:
                matrix_row.append(destinations[j]["duration"])
            elif i == j:
                matrix_row.append(0)
            elif i < j:
                matrix_row.append(destinations[j - 1]["duration"])
        time_matrix.append(matrix_row)

    path_indices, total_duration = solve_tsp(time_matrix)

    if path_indices is None:
        return {"error": "Could not find a solution for the route."}

    # NOTE: 결과 백엔드로 보내기 위한 포맷팅
    formatted_route = {"route": []}

    # Iterate through the optimized path to build the response
    for i, node_index in enumerate(path_indices):
        event_order = i + 1
        current_place_id = place_ids[node_index]

        # Determine the travel time to the next place
        next_travel_time = None
        if i < len(path_indices) - 1:
            next_node_index = path_indices[i + 1]
            next_travel_time = time_matrix[node_index][next_node_index]

        formatted_route["route"].append(
            {
                "id": current_place_id,
                "eventOrder": event_order,
                "nextTravelTime": next_travel_time,
            }
        )

    return formatted_route