import os
import json
import tour_api
import kakao_maps_api

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


if __name__ == "__main__":
    data = tour_api.get_data_list()
    print(data["response"]["body"]["totalCount"], "개의 관광지 데이터가 조회되었습니다.")
    count = 0
    percentage = 0

    for item in data["response"]["body"]["items"]["item"]:
        content_id = item["contentid"]
        content_type_id = item["contenttypeid"]
        query = item["title"]
        x = item["mapx"]
        y = item["mapy"]

        # item["images"] = tour_api.get_image_data_by_id(content_id)
        # item["detail"] = tour_api.get_detail_data_by_id(content_id, content_type_id)
        item["kakao"] = kakao_maps_api.get_data_by_name_pos(query, x, y)

        # Progress indicator
        count += 1
        if count % 504 == 0:
            print("■", end="", flush=True)
        if count % 5040 == 0:
            percentage += 10
            print(f" {percentage}%", flush=True)

    save_path = os.path.join(BASE_DIR, "raw", "tour_api_data.json")
    with open(save_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("데이터가 tour_api_data.json 파일에 저장되었습니다.")
