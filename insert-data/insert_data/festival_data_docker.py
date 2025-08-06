#  [
#   {
#     "link": "https://korean.visitkorea.or.kr/kfes/detail/fstvlDetail.do?fstvlCntntsId=5c6f22a7-b530-43fe-842c-1603384c68fb&cntntsNm=대한민국펫캉스",
#     "name": "대한민국 펫캉스",
#     "description_short": "반려동물과 떠나는 여름 힐링 페스타",
#     "description": "반려동물 인구1500만시대, 반려동물과 함께하는 여가산업과 관광산업 시장이 활성화 추세이다. 경상북도와 구미시 후원으로 진행되는 해당 축제는 구미시 동물정책사업 홍보와 다양한 반려동물 콘테츠 개발을 위한 자리로 반려견, 반려묘 뿐 아니라 파충류, 양서류 등 다양한 반려동물을 위한 공간이 마련된다. 유기동물 입양 캠페인을 통한 사회적 문제 해결은 물론 펫 산업 관련기관 및 업체 등이 참여, 반려인을 위한 행사이다.",
#     "images": [
#       "\"https://kfescdn.visitkorea.or.kr/kfes/upload/contents/db/400_5c6f22a7-b530-43fe-842c-1603384c68fb_4.jpg\"",
#       "\"https://kfescdn.visitkorea.or.kr/kfes/upload/contents/db/400_5c6f22a7-b530-43fe-842c-1603384c68fb_5.jpg\"",
#       "\"https://kfescdn.visitkorea.or.kr/kfes/upload/contents/db/400_5c6f22a7-b530-43fe-842c-1603384c68fb_6.jpg\"",
#       "\"https://kfescdn.visitkorea.or.kr/kfes/upload/contents/db/400_5c6f22a7-b530-43fe-842c-1603384c68fb_7.jpg\""
#     ],
#     "period": "2025.07.25 ~ 2025.07.27",
#     "address": "경상북도 구미시 산동읍 첨단기업1로 49",
#     "price": "무료",
#     "organizer": "(사)한국마이스진흥재단",
#     "info_center": "053-567-4497",
#     "sns": "https://www.instagram.com/korea_petcance/",
#     "homepage": "https://2025koreapetcance.co.kr/",
#     "x": "128.442232571322",
#     "y": "36.1415966922556",
#     "description_embedding": [   ]
#   },
#   ,,,
#  ]
import os
import json
import psycopg2

# 환경변수에서 DB 접속 정보 읽기
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", 5432)
DB_NAME = os.getenv("POSTGRES_DB", "postgres")
DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "ssafy")

# JSON 로드
with open('festival_data_embedding.json', encoding='utf-8') as f:
    festivals = json.load(f)

# DB 연결
conn = psycopg2.connect(
    host=DB_HOST, port=DB_PORT,
    dbname=DB_NAME, user=DB_USER, password=DB_PASS
)
cur = conn.cursor()

for fest in festivals:

    #    (category_id는 이미 만들어둔 categories에 맞춰서 적절히 설정하세요)
    category_id = 2  # 예: '축제' 카테고리 ID
    place_name = fest.get("name")
    place_url  = fest.get("link")
    address    = fest.get("address")
    # road_address_name 필드가 NOT NULL 이므로, address와 같게 넣거나 적절히 가공
    road_address = address
    lng = float(fest.get("x"))
    lat = float(fest.get("y"))
    emb_list = fest.get("description_embedding") or []
    embedding = emb_list if len(emb_list) == 3072 else None
    # 1) places 테이블에 기본 place 정보 넣기
    cur.execute("""
        INSERT INTO places (
          category_id, kakao_id, place_name, place_url,
          address_name, road_address_name, lng, lat
        ) VALUES (
          %s, NULL, %s, %s, %s, %s, %s, %s
        )
        RETURNING id
    """, (
        category_id, place_name, place_url,
        address,    road_address,   lng, lat
    ))
    place_id = cur.fetchone()[0]

    # 2) festivals 테이블에 페스티벌 상세 정보 삽입
    cur.execute("""
        INSERT INTO festivals (
            place_id, homepage, info_center,
            organizer, period, price, sns,
            description, description_short,
            embedding                        -- 여기에 추가
        ) VALUES (
            %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s,
            %s                               -- placeholder 추가
        )
    """, (
        place_id,
        fest.get("homepage"),
        fest.get("info_center"),
        fest.get("organizer"),
        fest.get("period"),
        fest.get("price"),
        fest.get("sns"),
        fest.get("description"),
        fest.get("description_short"),
        embedding                          # 실제 embedding 값
    ))

# 커밋 & 종료
conn.commit()
cur.close()
conn.close()
print("festival 데이터 삽입 완료!")
