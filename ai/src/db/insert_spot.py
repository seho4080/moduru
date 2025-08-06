import json
import psycopg2
import numpy as np
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "..", "..", "data", "spot_data_embedding.json")

# NOTE: 시도명 → 지역 코드 매핑
REGION_MAPPING = {
    "서울": 1,
    "부산": 2,
    "대구": 3,
    "인천": 4,
    "광주": 5,
    "대전": 6,
    "울산": 7,
    "세종": 8,
    "경기": 9,
    "강원": 10,
    "충북": 11,
    "충남": 12,
    "경북": 13,
    "경남": 14,
    "전북": 15,
    "전남": 16,
    "제주": 17,
}


def truncate(text, max_length):
    return text[:max_length] if text and len(text) > max_length else text


def extract_region_code(address):
    if not address:
        return None
    for region_name, code in REGION_MAPPING.items():
        if address.startswith(region_name):
            return code
    return None


# DB 연결
conn = psycopg2.connect(host="localhost", dbname="postgres", user="postgres", password="ssafy")
cur = conn.cursor()

# JSON 파일 로드
with open(DATA_PATH, encoding="utf-8") as f:
    data = json.load(f)

for item in data:
    name = item.get("name")
    description = item.get("description")
    description_short = item.get("description_short")
    info_center = truncate(item.get("info_center") or None, 50)
    homepage = truncate(item.get("homepage") or None, 255)
    business_hours = truncate(item.get("business_hours") or None, 255)
    rest_date = truncate(item.get("rest_date") or None, 100)
    parking = truncate(item.get("parking") or None, 100)
    price = truncate(item.get("price") or None, 100)
    tags = item.get("tags", [])

    kakao = item.get("kakao", {})
    kakao_id = int(kakao.get("id")) if kakao.get("id") else None
    place_url = kakao.get("place_url")
    lng = float(kakao.get("x")) if kakao.get("x") else None
    lat = float(kakao.get("y")) if kakao.get("y") else None
    address_name = kakao.get("address_name") or ""
    road_address_name = kakao.get("road_address_name") or ""

    region_code = extract_region_code(address_name)

    embedding = item.get("description_embedding")
    embedding = np.array(embedding, dtype=np.float32).tolist() if embedding else None

    # places 삽입 (region_code 추가됨)
    cur.execute(
        """
        INSERT INTO moduru.places (
            category_id, kakao_id, place_name, place_url,
            address_name, road_address_name,
            lng, lat, embedding, region_code
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (2, kakao_id, name, place_url, address_name, road_address_name, lng, lat, embedding, region_code),
    )
    place_id = cur.fetchone()[0]

    # 이미지 삽입
    for img_url in item.get("images", []):
        cur.execute("INSERT INTO moduru.place_metadata_images (place_id, img_url) VALUES (%s, %s)", (place_id, img_url))

    # 태그 삽입
    for tag in tags:
        tag = truncate(tag, 30)
        cur.execute("INSERT INTO moduru.place_metadata_tags (place_id, content) VALUES (%s, %s)", (place_id, tag))

    # spots 삽입
    cur.execute(
        """
        INSERT INTO moduru.spots (
            place_id, description, description_short,
            info_center, homepage, business_hours,
            rest_date, parking, price
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (place_id, description, description_short, info_center, homepage, business_hours, rest_date, parking, price),
    )

conn.commit()
cur.close()
conn.close()
print("spot 데이터 삽입 완료")
