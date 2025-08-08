import os
import requests
from dotenv import load_dotenv

load_dotenv()
KAKAO_API_KEY = os.getenv("KAKAO_API_KEY")


# 쿼리문을 기준으로 장소 1개에 대한 정보를 반환하는 함수
def search_place(query, x=None, y=None):
    url = "https://dapi.kakao.com/v2/local/search/keyword"
    headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}

    if x and y:
        params = {
            "query": query,
            "x": x,
            "y": y,
            "size": "1",
        }
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


def find_routes(data):
    result = []
    url = "https://apis-navi.kakaomobility.com/v1/destinations/directions"
    headers = {
        "Authorization": f"KakaoAK {KAKAO_API_KEY}",
        "Content-Type": "application/json",
    }

    for i in range(len(data)):
        params = {
            "radius": 10000,
            "origin": {
                "x": data[i]["lng"],
                "y": data[i]["lat"],
                "name": str(data[i]["id"]),
            },
        }
        destinations = []

        for j in range(len(data)):
            if i == j:
                continue
            destinations.append(
                {
                    "x": data[j]["lng"],
                    "y": data[j]["lat"],
                    "key": str(data[j]["id"]),
                }
            )
        params["destinations"] = destinations

        response = requests.post(url, headers=headers, json=params)

        if response.status_code == 200:
            routes = response.json()
            result.append(
                {
                    "origin_id": data[i]["id"],
                    "destinations": [
                        {
                            "destination_id": route["key"],
                            "distance": route["summary"]["distance"],
                            "duration": route["summary"]["duration"],
                        }
                        for route in routes["routes"]
                    ],
                }
            )
        else:
            print("Kakao API 요청 실패:", response.status_code)
            return None

    return result


if __name__ == "__main__":
    pass
