import json
import psycopg2
import numpy as np
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "..", "..", "data", "festival_data_embedding.json")


def truncate(text, max_length):
    return text[:max_length] if text and len(text) > max_length else text


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
    address = item.get("address")
    place_url = truncate(item.get("link"), 500)
    lng = float(item.get("x"))
    lat = float(item.get("y"))
    embedding = item.get("description_embedding")
    embedding = np.array(embedding, dtype=np.float32).tolist() if embedding else None
    road_address = ""  # 필수값 대응

    # moduru.places 테이블 삽입
    cur.execute(
        """
        INSERT INTO moduru.places (
            category_id, kakao_id, place_name, place_url,
            address_name, road_address_name,
            lng, lat, embedding
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (3, None, name, place_url, address, road_address, lng, lat, embedding),
    )
    place_id = cur.fetchone()[0]

    # 이미지 삽입
    for img_url in item.get("images", []):
        cur.execute("INSERT INTO moduru.place_metadata_images (place_id, img_url) VALUES (%s, %s)", (place_id, img_url))

    # festival 테이블 삽입
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
