from fastapi import FastAPI, Query
import modules.gms_api as gms
import modules.kakao_maps_api as kakao
import modules.utils as utils
from sklearn.cluster import KMeans

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


def recommend_route(data):
    routes = kakao.find_routes(data)
    return routes


@app.get("/recommend/places")
def get_recommendations(region_id: int = Query(...), query: str = Query(...)):
    return recommend_places(region_id, query)


if __name__ == "__main__":
    place_list = [
        {"id": 400, "category_id": 1, "lat": 36.3447753226941, "lng": 127.433183296499},
        {"id": 1551, "category_id": 2, "lat": 36.3668725417191, "lng": 127.385713083518},
        {"id": 1546, "category_id": 2, "lat": 36.3234673989231, "lng": 127.424285321913},
        # {"id": 653, "category_id": 3, "lat": 36.376625791745, "lng": 127.38720183152},
        # {"id": 3305, "category_id": 1, "lat": 36.3349680255062, "lng": 127.336580105071},
        # {"id": 3608, "category_id": 2, "lat": 36.345984114769, "lng": 127.456106584105},
        # {"id": 3729, "category_id": 2, "lat": 36.3471971249462, "lng": 127.457512826102},
    ]
    print(kakao.find_routes(place_list))
