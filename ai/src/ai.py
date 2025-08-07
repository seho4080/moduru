import modules.gms_api as gms_api
import modules.utils as utils


def recommend_places(region_id, query):
    query_embedding = gms_api.text_embedding(query)
    similar_places = utils.cosine_similarity(region_id, query_embedding)
    place_list = gms_api.filter_valid(similar_places, query)

    return place_list


if __name__ == "__main__":
    print(recommend_places(1, "맛있는 음식점 추천해줘"))
