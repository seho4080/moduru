import os
import requests
from dotenv import load_dotenv

load_dotenv()
KAKAO_API_KEY = os.getenv("KAKAO_API_KEY")


# 쿼리문을 기준으로 장소 1개에 대한 정보를 반환하는 함수
def search_data(query, x=None, y=None):
    url = "https://dapi.kakao.com/v2/local/search/keyword"
    headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}

    if x and y:
        params = {"query": query, "x": x, "y": y, "size": "1"}
    else:
        params = {
            "query": query,
            "size": "1",
        }

    response = requests.get(url, headers=headers, params=params)

    if response.status_code == 200:
        data = response.json()
        return data["documents"][0] if data["documents"] else None
    else:
        print("Kakao API 요청 실패:", response.status_code)
        return None


def search_xy(address):
    url = "https://dapi.kakao.com/v2/local/search/address"
    headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}
    params = {
        "query": address,
        "analyze_type": "similar",
        "size": "1",
    }
    response = requests.get(url, headers=headers, params=params)

    if response.status_code == 200:
        data = response.json()
        return data["documents"][0] if data["documents"] else None
    else:
        print("Kakao API 요청 실패:", response.status_code)
        return None


def find_route(start_x, start_y, end_x, end_y):
    url = "https://apis-navi.kakaomobility.com/v1/directions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"KakaoAK {KAKAO_API_KEY}",
    }
    params = {
        "origin": {
            "x": start_x,
            "y": start_y,
        },
        "destination": {
            "x": end_x,
            "y": end_y,
        },
        "priority": "RECOMMEND",
    }
    response = requests.get(url, headers=headers, params=params)

    if response.status_code == 200:
        data = response.json()
        return data["documents"][0] if data["documents"] else None
    else:
        print("Kakao API 요청 실패:", response.status_code)
        return None


if __name__ == "__main__":
    ing = find_route(126.978388, 37.566610, 126.985, 37.565)
    if ing:
        print("Route found:", ing)
