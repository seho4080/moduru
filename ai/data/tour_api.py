import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
TOUR_API_KEY = os.getenv("TOUR_API_KEY")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# API에서 전국 관광지 데이터를 가져와서 JSON 파일로 저장하는 함수
def get_data_list():
    url = "http://apis.data.go.kr/B551011/KorService2/areaBasedList2"
    params = {
        "numOfRows": "100000",
        "MobileOS": "ETC",
        "MobileApp": "Moduru",
        "serviceKey": TOUR_API_KEY,
        "_type": "json",
        "areaCode": "1",
    }
    response = requests.get(url, params=params)

    if response.status_code == 200:
        data = response.json()
        save_path = os.path.join(BASE_DIR, "raw", "tour_api_data.json")

        with open(save_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("JSON 데이터가 tour_api_data.json 파일에 저장되었습니다.")
    else:
        print("API 요청 실패:", response.status_code)


# API에서 특정 관광지의 상세정보를 가져오는 함수
def get_detail_data_by_id(content_id, content_type_id):
    url = "http://apis.data.go.kr/B551011/KorService2/detailInfo2"
    params = {
        "MobileOS": "ETC",
        "MobileApp": "Moduru",
        "serviceKey": TOUR_API_KEY,
        "_type": "json",
        "contentId": content_id,
        "contentTypeId": content_type_id,
    }
    response = requests.get(url, params=params)

    if response.status_code == 200:
        data = response.json()
        return data["response"]["body"]["items"]["item"][0]
    else:
        print("API 요청 실패:", response.status_code)
        print("content_id: ", content_id)
        exit(1)


# API에서 특정 관광지의 이미지 정보를 가져오는 함수
def get_image_data_by_id(content_id):
    url = "http://apis.data.go.kr/B551011/KorService2/detailImage2"
    params = {
        "MobileOS": "ETC",
        "MobileApp": "Moduru",
        "serviceKey": TOUR_API_KEY,
        "_type": "json",
        "contentId": content_id,
    }
    response = requests.get(url, params=params)

    if response.status_code == 200:
        data = response.json()
        # 이미지가 없는 경우 ['item'] 항목이 없어 TypeError 발생하므로 예외처리
        try:
            return data["response"]["body"]["items"]["item"][0]
        except TypeError:
            return None
    else:
        print("API 요청 실패: ", response.status_code)
        print("content_id: ", content_id)
        exit(1)


# 기존 데이터의 id를 이용해 상세정보/이미지 API를 호출해서 추가하고 저장하는 함수
def enrich_data_with_api(data):
    for item in data["response"]["body"]["items"]["item"][:10]:
        content_id = item["contentid"]
        content_type_id = item["contenttypeid"]

        item["detail"] = get_detail_data_by_id(content_id, content_type_id)
        item["images"] = get_image_data_by_id(content_id)

    save_path = os.path.join(BASE_DIR, "raw", "enriched_tour_api_data.json")
    with open(save_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("JSON 데이터가 enriched_tour_api_data.json 파일에 저장되었습니다.")


# get_tour_api_data_list()는 최초 한 번만 호출
if __name__ == "__main__":
    # get_tour_api_data_list() 호출하고 생긴 JSON 파일 사용
    file_path = os.path.join(BASE_DIR, "raw", "tour_api_data.json")
    with open(file_path, encoding="utf-8") as f:
        data = json.load(f)
        enrich_data_with_api(data)
