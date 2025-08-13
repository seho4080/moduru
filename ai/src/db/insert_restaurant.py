import json
import psycopg2
import numpy as np
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "..", "..", "data", "restaurant_data_embedding.json")

conn = psycopg2.connect(
    host=os.getenv("POSTGRES_HOST", "localhost"),
    port=os.getenv("POSTGRES_PORT", 5432),
    dbname=os.getenv("POSTGRES_DB", "mydb"),
    user=os.getenv("POSTGRES_USER", "postgres"),
    password=os.getenv("POSTGRES_PASSWORD", "ssafy"),
)
cur = conn.cursor()

REGION_MAPPING = {
    "서울특별시": 0,
    "부산광역시": 1,
    "대구광역시": 2,
    "인천광역시": 3,
    "광주광역시": 4,
    "대전광역시": 5,
    "울산광역시": 6,
    "세종특별자치시": 7,
    "제주특별자치도": 16,
    "수원시": 17,
    "성남시": 18,
    "고양시": 19,
    "용인시": 20,
    "부천시": 21,
    "안산시": 22,
    "안양시": 23,
    "남양주시": 24,
    "화성시": 25,
    "평택시": 26,
    "의정부시": 27,
    "시흥시": 28,
    "파주시": 29,
    "광명시": 30,
    "김포시": 31,
    "광주시": 32,
    "군포시": 33,
    "이천시": 34,
    "양주시": 35,
    "오산시": 36,
    "구리시": 37,
    "안성시": 38,
    "의왕시": 39,
    "하남시": 40,
    "포천시": 41,
    "여주시": 42,
    "동두천시": 43,
    "과천시": 44,
    "가평군": 45,
    "연천군": 46,
    "양평군": 47,
    "춘천시": 48,
    "원주시": 49,
    "강릉시": 50,
    "동해시": 51,
    "태백시": 52,
    "속초시": 53,
    "삼척시": 54,
    "홍천군": 55,
    "횡성군": 56,
    "영월군": 57,
    "평창군": 58,
    "정선군": 59,
    "철원군": 60,
    "화천군": 61,
    "양구군": 62,
    "인제군": 63,
    "고성군": 64,
    "양양군": 65,
    "청주시": 66,
    "충주시": 67,
    "제천시": 68,
    "보은군": 69,
    "옥천군": 70,
    "영동군": 71,
    "증평군": 72,
    "진천군": 73,
    "괴산군": 74,
    "음성군": 75,
    "단양군": 76,
    "천안시": 77,
    "공주시": 78,
    "보령시": 79,
    "아산시": 80,
    "서산시": 81,
    "논산시": 82,
    "계룡시": 83,
    "당진시": 84,
    "금산군": 85,
    "부여군": 86,
    "서천군": 87,
    "청양군": 88,
    "홍성군": 89,
    "예산군": 90,
    "태안군": 91,
    "전주시": 92,
    "군산시": 93,
    "익산시": 94,
    "정읍시": 95,
    "남원시": 96,
    "김제시": 97,
    "완주군": 98,
    "진안군": 99,
    "무주군": 100,
    "장수군": 101,
    "임실군": 102,
    "순창군": 103,
    "고창군": 104,
    "부안군": 105,
    "목포시": 106,
    "여수시": 107,
    "순천시": 108,
    "나주시": 109,
    "광양시": 110,
    "담양군": 111,
    "곡성군": 112,
    "구례군": 113,
    "고흥군": 114,
    "보성군": 115,
    "화순군": 116,
    "장흥군": 117,
    "강진군": 118,
    "해남군": 119,
    "영암군": 120,
    "무안군": 121,
    "함평군": 122,
    "영광군": 123,
    "장성군": 124,
    "완도군": 125,
    "진도군": 126,
    "신안군": 127,
    "포항시": 128,
    "경주시": 129,
    "김천시": 130,
    "안동시": 131,
    "구미시": 132,
    "영주시": 133,
    "영천시": 134,
    "상주시": 135,
    "문경시": 136,
    "경산시": 137,
    "의성군": 138,
    "청송군": 139,
    "영양군": 140,
    "영덕군": 141,
    "청도군": 142,
    "고령군": 143,
    "성주군": 144,
    "칠곡군": 145,
    "예천군": 146,
    "봉화군": 147,
    "울진군": 148,
    "울릉군": 149,
    "창원시": 150,
    "진주시": 151,
    "통영시": 152,
    "사천시": 153,
    "김해시": 154,
    "밀양시": 155,
    "거제시": 156,
    "양산시": 157,
    "의령군": 158,
    "함안군": 159,
    "창녕군": 160,
    "고성군": 161,
    "남해군": 162,
    "하동군": 163,
    "산청군": 164,
    "함양군": 165,
    "거창군": 166,
    "합천군": 167,
}


def truncate(text, max_length):
    return text[:max_length] if text and len(text) > max_length else text


def extract_region_id(address):
    if not address:
        return None
    for region_name, code in REGION_MAPPING.items():
        if region_name in address:  # 주소 안에 지역명이 포함되어 있으면
            return code
    return None


with open(DATA_PATH, encoding="utf-8") as f:
    data = json.load(f)

for item in data:
    name = item.get("name")
    description = item.get("description")
    description_short = item.get("description_short")
    tel = truncate(item.get("tel") or None, 50)
    homepage = truncate(item.get("homepage") or None, 255)
    business_hours = truncate(item.get("business_hours") or None, 255)
    rest_date = truncate(item.get("rest_date") or None, 100)
    parking = truncate(item.get("parking") or None, 100)
    menus = item.get("menus", [])
    tags = item.get("tags", [])

    kakao = item.get("kakao", {})
    kakao_id = int(kakao.get("id")) if kakao.get("id") else None
    place_url = kakao.get("place_url")
    lng = float(kakao.get("x")) if kakao.get("x") else None
    lat = float(kakao.get("y")) if kakao.get("y") else None
    address_name = item.get("address") or ""
    road_address_name = kakao.get("road_address_name") or ""

    region_id = extract_region_id(address_name)

    embedding = item.get("description_embedding")
    embedding = np.array(embedding, dtype=np.float32).tolist() if embedding else None

    cur.execute(
        """
        INSERT INTO places (
            category_id, kakao_id, place_name, place_url,
            address_name, road_address_name,
            lng, lat, embedding, region_id
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (1, kakao_id, name, place_url, address_name, road_address_name, lng, lat, embedding, region_id),
    )
    place_id = cur.fetchone()[0]

    for img_url in item.get("images", []):
        cur.execute(
            "INSERT INTO place_images (place_id, img_url) VALUES (%s, %s)",
            (place_id, img_url),
        )

    for tag in tags:
        tag = truncate(tag, 30)
        cur.execute(
            "INSERT INTO place_metadata_tags (place_id, content) VALUES (%s, %s)",
            (place_id, tag),
        )

    cur.execute(
        """
        INSERT INTO restaurants (
            place_id, description, description_short,
            tel, homepage, business_hours,
            rest_date, parking
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (place_id, description, description_short, tel, homepage, business_hours, rest_date, parking),
    )

    for menu in menus:
        menu = truncate(menu, 30)
        cur.execute(
            """
            INSERT INTO restaurant_menus (restaurant_id, menu)
            VALUES ((SELECT id FROM restaurants WHERE place_id = %s), %s)
            """,
            (place_id, menu),
        )

conn.commit()
cur.close()
conn.close()
print("restaurant 데이터 삽입 완료")
