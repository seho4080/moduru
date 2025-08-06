import os
import psycopg2
import json

DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", 5432)
DB_NAME = os.getenv("POSTGRES_DB", "postgres")
DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "ssafy")
# 카테고리 매핑: 필요 시 확장 가능
category_code_to_id = {
    "CE7": 1,
    # 다른 코드들도 여기에 추가 가능
}

# JSON 파일 로드
with open('restaurant_data_embedding.json', encoding='utf-8') as f:
    data = json.load(f)

# PostgreSQL 연결
conn = psycopg2.connect(
    host=DB_HOST,
    port=DB_PORT,
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASS
)
cur = conn.cursor()

for place in data:
    kakao = place.get("kakao", {})

    # ✅ 필수 필드 체크: 하나라도 None/빈값이면 skip
    required_fields = [
        kakao.get("id"),
        kakao.get("place_name"),
        kakao.get("place_url"),
        kakao.get("address_name"),
        kakao.get("road_address_name"),
        kakao.get("x"),
        kakao.get("y"),
        place.get("description"),
        place.get("description_short"),
        place.get("tel"),
        place.get("menus"),
        place.get("description_embedding"),
    ]
    if any(f is None or f == "" or f == [] for f in required_fields):
        continue

    # === [1] places 테이블 insert ===
    category_id = category_code_to_id.get(kakao.get("category_group_code"))
    if category_id is None:
        continue  # 또는 로그 출력 후 건너뛰기
    kakao_id = int(kakao.get("id"))
    place_name = kakao.get("place_name")
    place_url = kakao.get("place_url")
    address_name = kakao.get("address_name")
    road_address_name = kakao.get("road_address_name")
    lng = float(kakao.get("x"))
    lat = float(kakao.get("y"))
    embedding = place.get("description_embedding")
    cur.execute("""
        INSERT INTO places (
            category_id,
            kakao_id,
            place_name,
            place_url,
            address_name,
            road_address_name,
            lng,
            lat
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s
        )
        RETURNING id
    """, (
        category_id,
        kakao_id,
        place_name,
        place_url,
        address_name,
        road_address_name,
        lng,
        lat
        # embedding
    ))
    place_id = cur.fetchone()[0]

    # === [2] restaurants 테이블 insert ===
    cur.execute("""
        INSERT INTO restaurants (
            place_id, description, description_short,
            tel, homepage, business_hours, rest_date, parking
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (
        place_id,
        place.get("description"),
        place.get("description_short"),
        place.get("tel"),
        place.get("homepage"),
        place.get("business_hours"),
        place.get("rest_date"),
        place.get("parking"),
    ))
    restaurant_id = cur.fetchone()[0]

    # === [3] restaurant_menus 테이블 insert ===
    for menu in place.get("menus", []):
        cur.execute("""
            INSERT INTO restaurant_menus (restaurant_id, menu)
            VALUES (%s, %s)
        """, (restaurant_id, menu))

# 최종 반영
conn.commit()
cur.close()
conn.close()
print("✅ 필수 값이 있는 데이터만 삽입 완료!")
