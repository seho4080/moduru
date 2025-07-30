import os
import requests
from dotenv import load_dotenv

load_dotenv()
TOUR_API_KEY = os.getenv("TOUR_API_KEY")


# API에서 전국 관광지 데이터를 가져와서 JSON 파일로 저장하는 함수
def get_data_list():
    url = "http://apis.data.go.kr/B551011/KorService2/areaBasedList2"
    params = {
        "numOfRows": "100000",
        "MobileOS": "WEB",
        "MobileApp": "Moduru",
        "serviceKey": TOUR_API_KEY,
        "_type": "json",
    }
    response = requests.get(url, params=params)

    if response.status_code == 200:
        data = response.json()
        return data
    else:
        print("API 요청 실패:", response.status_code)
        return None


# API에서 {id} 관광지의 상세정보를 가져오는 함수
def get_detail_data_by_id(content_id, content_type_id):
    url = "http://apis.data.go.kr/B551011/KorService2/detailInfo2"
    params = {
        "MobileOS": "WEB",
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
        return None


# API에서 {id} 관광지의 이미지 정보를 가져오는 함수
def get_image_data_by_id(content_id):
    url = "http://apis.data.go.kr/B551011/KorService2/detailImage2"
    params = {
        "MobileOS": "WEB",
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
        return None
