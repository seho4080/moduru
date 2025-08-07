import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
gms_api_key = os.getenv("GMS_API_KEY")


# GMS API를 사용하여 텍스트 임베딩을 요청하는 함수
def text_embedding(text):
    url = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/embeddings"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {gms_api_key}",
    }
    data = {
        "model": "text-embedding-3-small",
        "input": text,
    }

    response = requests.post(url, headers=headers, data=json.dumps(data))
    if response.status_code == 200:
        data = response.json()
        return data["data"][0]["embedding"]
    else:
        print("GMS API 요청 실패:", response.status_code, response.text)
        return None


def filter_valid(place_list, query):
    url = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {gms_api_key}",
    }
    data = {
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": """
                    You should check the provided place list.
                    The structure of the place list consists of id, place_name, address_name, 
                    business_hours(break time and last order time included), 
                    and description in order. Check the user question and return the ID and place_name only if the 
                    address_name, business_time, and description provided are recommended based on the user question.
                    For business_hours, we are not open during break time, so please consider it carefully.
                    answer format: [place_id1, place_id2, ...]
                """,
            },
            {
                "role": "user",
                "content": f"""
                    user question: {query}
                    places: {place_list},
                """,
            },
        ],
        "max_tokens": 4096,
        "temperature": 0,
    }

    response = requests.post(url, headers=headers, data=json.dumps(data))
    if response.status_code == 200:
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()
    else:
        print("GMS API 요청 실패:", response.status_code, response.text)
        return None


# TODO: 장소랑 날짜를 받아서 일정을 생성하는 함수
def make_schedule(days, place_list):
    pass


if __name__ == "__main__":
    print(
        text_embedding(
            "1996년 10월에 ‘화순 운주 대축제’라는 명칭으로 시작된 화순 운주 문화 축제는 신비로운 운주사 천불 천탑의 이루지 못한 꿈을 오늘에 재현하고자 시작되었으며 주민참여로 이루어지는 풍물놀이와 운주사 천불천탑의 신비함을 이야기하는 토크콘서트, 운주사를 다룬 문학작품전시, 음악회와 사찰 음식 체험 등의 공연과 체험 행사도 진행된다.\n주소: 전라남도 화순군 도암면 대초리 19-2 화순 운주사"
        )
    )
