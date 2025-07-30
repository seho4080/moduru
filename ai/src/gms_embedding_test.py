import os
import requests
import json
from dotenv import load_dotenv


load_dotenv()
gms_api_key = os.getenv("GMS_API_KEY")

url = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/embeddings"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {gms_api_key}",
}
data = {
    "model": "text-embedding-3-large",
    "input": "대전 3일 여행 일정 추천해드릴게요!---\n\n### 1일차: 대전 시내 탐방\n- **오전**\n  - 대전역 도착 후 숙소 체크인\n  - **한밭수 목원** 산책: 도심 속 자연을 느낄 수 있는 곳\n- **점심**\n  - 근처 맛집에서 대전 명물 칼국수 또는 닭갈비 맛보기\n- **오후**\n  - **대전시립미술관** 방문: 다양한 현대미술 작품 감상\n  - **엑스포과학공원** 산책 및 대전엑스포기념관 관람\n- **저녁**\n  - 둔산동 카페거리에서 커피 한잔하며 휴식\n  - 둔산동 맛집에서 저녁 식사\n\n---\n\n### 2 일차: 자연과 역사 체험\n- **오전**\n  - **계룡산 국립공원** 등산 또는 산책 (가벼운  코스 추천)\n- **점심**\n  - 계룡산 근처 한식당에서 산채비빔밥 등 건강식\n- **오후**\n  - **유성온천** 방문: 온천욕으로 피로 풀기\n  - **국립중앙과학관** 관람: 다양한 과학 전시와 체험 가능\n- **저녁**\n  - 유성구 맛집에서 저녁 식사\n\n---\n\n### 3일차: 문화와 쇼핑\n- **오전**\n  - **대전근현대사전시관** 방문: 대전의 역 - **중앙시장** 구경하며 전통시장 체험 및 간식거리 맛보기\n- **점심**\n  - 중앙시장 근처에서 국밥 또는 분식류 맛보기\n- **오후**\n  - **갤러리아 타임월드** 쇼핑 및 카페 휴식\n- **저녁**\n  - 대전 역 근처에서 마무리 식사 후 출발\n\n---\n\n즐거운 대전 여행 되세요! 필요하시면 교통편이나 맛집 추천도 도와드릴게요.",
}

response = requests.post(url, headers=headers, data=json.dumps(data))
print(response.status_code)
print(response.json())
