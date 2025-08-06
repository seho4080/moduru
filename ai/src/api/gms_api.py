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
        "model": "text-embedding-3-large",
        "input": text,
    }

    response = requests.post(url, headers=headers, data=json.dumps(data))
    if response.status_code == 200:
        data = response.json()
        return data["data"][0]["embedding"]
    else:
        print("GMS API 요청 실패:", response.status_code, response.text)
        return None


def recommend(query):
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
                "content": "너는 사실 기반 정보만 제공하는 여행 가이드임.",
            },
            {
                "role": "user",
                "content": query,
            },
        ],
        "max_tokens": 4096,
        "temperature": 0.1,
    }

    response = requests.post(url, headers=headers, data=json.dumps(data))
    if response.status_code == 200:
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()
    else:
        print("GMS API 요청 실패:", response.status_code, response.text)
        return None


if __name__ == "__main__":
    query = ""
    sdas = recommend("서울 야경이 잘 보이는 맛집 추천해줘.")

    print(sdas)
