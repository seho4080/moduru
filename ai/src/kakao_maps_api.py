import os
import requests
from dotenv import load_dotenv

load_dotenv()
KAKAO_API_KEY = os.getenv("KAKAO_API_KEY")


# 쿼리문을 기준으로 장소 1개에 대한 정보를 반환하는 함수
def search_data(query):
    url = "https://dapi.kakao.com/v2/local/search/keyword"
    headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}
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
