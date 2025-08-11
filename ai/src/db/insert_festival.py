import json
import psycopg2
import numpy as np
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "..", "..", "data", "festival_data_embedding.json")

# NOTE: 전체 행정구역명을 regions 테이블의 id로 매핑
REGION_MAPPING = {
    "서울특별시": 1,
    "부산광역시": 2,
    "대구광역시": 3,
    "인천광역시": 4,
    "광주광역시": 5,
    "대전광역시": 6,
    "울산광역시": 7,
    "세종특별자치시": 8,
    "경기도": 9,
    "강원특별자치도": 10,
    "충청북도": 11,
    "충청남도": 12,
    "경상북도": 13,
    "경상남도": 14,
    "전북특별자치도": 15,
    "전라남도": 16,
    "제주특별자치도": 17,
}


def truncate(text, max_length):
    return text[:max_length] if text and len(text) > max_length else text


def extract_region_code(address):
    if not address:
        return None
    for full_name, code in REGION_MAPPING.items():
        if address.startswith(full_name):
            return code
    return None


conn = psycopg2.connect(host="localhost", dbname="postgres", user="postgres", password="ssafy")
cur = conn.cursor()

with open(DATA_PATH, encoding="utf-8") as f:
    data = json.load(f)

for item in data:
    name = item.get("name")
    description = item.get("description")
    description_short = item.get("description_short")
    homepage = truncate(item.get("homepage") or None, 255)
    info_center = truncate(item.get("info_center") or None, 100)
    sns = truncate(item.get("sns") or None, 100)
    price = truncate(item.get("price") or None, 100)
    period = truncate(item.get("period") or None, 100)
    organizer = truncate(item.get("organizer") or None, 50)
    address = item.get("address") or ""
    road_address = ""  # 공란 대응
    place_url = truncate(item.get("link"), 500)

    lng = float(item.get("x")) if item.get("x") else None
    lat = float(item.get("y")) if item.get("y") else None

    region_code = extract_region_code(address)

    embedding = item.get("description_embedding")
    embedding = np.array(embedding, dtype=np.float32).tolist() if embedding else None

    # places 삽입 (region_code 포함)
    cur.execute(
        """
        INSERT INTO moduru.places (
            category_id, kakao_id, place_name, place_url,
            address_name, road_address_name,
            lng, lat, embedding, region_code
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (3, None, name, place_url, address, road_address, lng, lat, embedding, region_code),
    )
    place_id = cur.fetchone()[0]

    # 이미지 삽입
    for img_url in item.get("images", []):
        cur.execute(
            "INSERT INTO moduru.place_metadata_images (place_id, img_url) VALUES (%s, %s)",
            (place_id, img_url),
        )

    # festivals 테이블 삽입
    cur.execute(
        """
        INSERT INTO moduru.festivals (
            place_id, description, description_short,
            homepage, info_center, period,
            price, organizer, sns
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (place_id, description, description_short, homepage, info_center, period, price, organizer, sns),
    )

conn.commit()
cur.close()
conn.close()
print("festival 데이터 삽입 완료")
