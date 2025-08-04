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
