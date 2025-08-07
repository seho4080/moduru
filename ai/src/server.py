# main.py
from fastapi import FastAPI, Query
import modules.gms_api as gms_api
import modules.utils as utils

app = FastAPI()


def recommend_places(region_id: int, query: str):
    query_embedding = gms_api.text_embedding(query)
    similar_places = utils.cosine_similarity(region_id, query_embedding)
    place_list = gms_api.filter_valid(similar_places, query)
    return place_list


@app.get("/recommend/places")
def get_recommendations(region_id: int = Query(...), query: str = Query(...)):
    return {"results": recommend_places(region_id, query)}
