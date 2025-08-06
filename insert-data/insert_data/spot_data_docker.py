# [
#   {
#     "name": "효령대군 이보 묘역",
#     "link": "https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=2356a3fd-ce72-49f8-8bba-09f4806f0032",
#     "description": "효령대군 이보 묘역은 조선 태종의 둘째 아들인 효령대군(1396~1486)과 그의 부인 해주 정씨(1394~1470)의 사당과 묘소이다. 이곳에는 두 분의 위패를 모신 사당인 청권사가 있다.효령대군의 이름은 보(補)인데 1412년(태종 12)에 효령대군으로 봉해졌다. 효령대군은 독서를 즐기고 활쏘기에 능했으며, 효성이 지극하고 우애가 깊었다. 영조는 1736년(영조 12) 이곳에 사당을 지었다. 그리고 정조는 1789년(정조 13)에 청권사라는 편액을 내렸다. 이 사당은 1972년 유형문화유산으로 지정된 후 1980년에 대대적으로 고쳤으나, 1984~1986년에 문화재보호구역 정비공사가 진행되며 묘역을 새로 정비할 때 옛 모습이 일부가 사라지고 말았다.이 묘역에는 신도비, 구 묘표 2기, 장명등, 문인석 2쌍이 남아 있어 조선 초기 대군 묘역의 규모와 형식을 보여주는 좋은 자료다.",
#     "description_short": "효령대군과 그의 부인 해주 정씨의 묘역",
#     "description_vector": null,
#     "info_center": "청권사 02-584-3121~4",
#     "homepage": "https://note.hyor.or.kr/",
#     "address": "서울특별시 서초구 효령로 135 (방배동)",
#     "business_hours": "10:00~16:00",
#     "rest_date": "주말 / 공휴일",
#     "parking": null,
#     "price": "무료",
#     "images": [
#       "https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=72ebd93c-9ccc-430b-ad63-76bcba2487c6",
#       "https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=8fb74edf-4efb-472f-b315-c80cc5181654",
#       "https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=a76e361b-c364-420b-b882-9067c7de7a46",
#       "https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=a487090b-14a1-4a25-996d-36f9fdf2bef0",
#       "https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=a48d0212-a393-4487-aa7d-ce0b457ecb33",
#       "https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=8b4dbdbd-3240-4793-8748-4d61090fe6ae",
#       "https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=f77ee2a3-20a4-4a0d-8a0d-033dbe043489"
#     ],
#     "tags": [
#       "관광지",
#       "서초효령대군묘",
#       "역사",
#       "역사공부",
#       "역사관광지",
#       "역사를품은곳",
#       "역사문화재",
#       "역사속",
#       "역사속으로",
#       "역사여행",
#       "역사유적",
#       "역사유적지",
#       "역사탐방",
#       "역사탐험",
#       "청권사",
#       "효령대군묘"
#     ],
#     "kakao": {
#       "address_name": "서울 서초구 방배동 191",
#       "category_group_code": "",
#       "category_group_name": "",
#       "category_name": "여행 > 관광,명소 > 문화유적 > 릉,묘,총",
#       "distance": "",
#       "id": "10954904",
#       "phone": "",
#       "place_name": "효령대군이보묘역",
#       "place_url": "http://place.map.kakao.com/10954904",
#       "road_address_name": "서울 서초구 효령로 135",
#       "x": "127.000144721068",
#       "y": "37.482562590959"
#     },
#     "description_embedding": []
#    }, 
# ,,, 
# ]
# scripts/load_spots.py

import os
import json
import psycopg2
from pgvector.psycopg2 import register_vector

# ───────────────────────────────────────────────────────────
# 1) 환경 변수에서 DB 접속 정보 읽기
# ───────────────────────────────────────────────────────────
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = int(os.getenv("POSTGRES_PORT", 5432))
DB_NAME = os.getenv("POSTGRES_DB", "postgres")
DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "ssafy")

# ───────────────────────────────────────────────────────────
# 2) JSON 파일 로드
# ───────────────────────────────────────────────────────────
with open('spot_data_embedding.json', encoding='utf-8') as f:
    spots = json.load(f)

# ───────────────────────────────────────────────────────────
# 3) DB 연결 및 vector 어댑터 등록
# ───────────────────────────────────────────────────────────
conn = psycopg2.connect(
    host=DB_HOST, port=DB_PORT,
    dbname=DB_NAME, user=DB_USER, password=DB_PASS
)
cur = conn.cursor()
register_vector(cur)  # psycopg2에 vector 타입 어댑터 등록

# ───────────────────────────────────────────────────────────
# 4) 반복 삽입 로직
# ───────────────────────────────────────────────────────────
for spot in spots:
    kakao = spot.get("kakao", {})

    # — 필수 필드 체크 (없으면 건너뛰기)
    required = [
        spot.get("name"),
        spot.get("link"),
        kakao.get("road_address_name"),
        kakao.get("x"),
        kakao.get("y"),
    ]
    if any(v is None or v == "" for v in required):
        continue

    # 4-1) places 테이블에 기본 정보 삽입
    #    카테고리 ID는 미리 만들어둔 값(예: '관광지' 카테고리)을 사용하세요
    category_id   = 3   # 예: spots용 카테고리 ID
    place_name    = kakao.get("place_name") or spot["name"]
    place_url     = kakao.get("place_url")  or spot.get("link")
    address       = kakao.get("address_name") or spot.get("address")
    road_address  = kakao.get("road_address_name")
    lng           = float(kakao.get("x"))
    lat           = float(kakao.get("y"))

    cur.execute("""
        INSERT INTO places (
            category_id, kakao_id, place_name, place_url,
            address_name, road_address_name, lng, lat
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s
        ) RETURNING id
    """, (
        category_id,
        int(kakao.get("id")) if kakao.get("id") else None,
        place_name,
        place_url,
        address,
        road_address,
        lng, lat
    ))
    place_id = cur.fetchone()[0]

    # 4-2) spots 테이블에 상세 정보 삽입
    embedding_list = spot.get("description_embedding") or []
    # dimension 불일치 시 NULL 처리
    embedding = embedding_list if len(embedding_list) == 3072 else None

    cur.execute("""
        INSERT INTO spots (
            place_id,
            business_hours,
            homepage,
            info_center,
            parking,
            price,
            rest_date,
            description,
            description_short,
            embedding
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
    """, (
        place_id,
        spot.get("business_hours"),
        spot.get("homepage"),
        spot.get("info_center"),
        spot.get("parking"),
        spot.get("price"),
        spot.get("rest_date"),
        spot.get("description"),
        spot.get("description_short"),
        embedding
    ))

# ───────────────────────────────────────────────────────────
# 5) 커밋 & 종료
# ───────────────────────────────────────────────────────────
conn.commit()
cur.close()
conn.close()
print("spots 데이터 삽입 완료!")
