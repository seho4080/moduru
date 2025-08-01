import kakao_maps_api
import gms_embedding
import os
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, "..", "data", "raw", "vk_spot_data.json")
SAVE_PATH = os.path.join(BASE_DIR, "..", "data", "raw", "spot_data1.json")
SAVE_EVERY = 1000  # 몇 건마다 저장할지 설정

# 이미 저장된 데이터 불러오기 및 중복 링크 집합 생성
existing_data = []
existing_links = set()
if os.path.exists(SAVE_PATH):
    with open(SAVE_PATH, "r", encoding="utf-8") as f:
        existing_data = json.load(f)
        existing_links = {item["link"] for item in existing_data if "link" in item}

# 원본 데이터 로드
with open(JSON_PATH, "r", encoding="utf-8") as f:
    raw_data = json.load(f)

for idx, item in enumerate(raw_data[:5000], 1):
    link = item.get("link", "")
    name = item.get("name", "")
    address = item.get("address", "")
    description = item.get("description", "")
    tags = item.get("tags", [])

    if link in existing_links:
        print(f"[{idx}/{len(raw_data)}] ⚠️ 중복 링크 건너뜀: {name}")
        continue

    # 카카오 맵 검색
    query = f"{address} {name}"
    kakao_data = kakao_maps_api.search_data(query)
    if kakao_data:
        item["kakao"] = kakao_data

    # 벡터 임베딩
    text = f"{description} 관련 태그: {', '.join(tags)}"
    item["description_embedding"] = gms_embedding.text_embedding(text)

    existing_data.append(item)
    existing_links.add(link)

    # 저장 주기에 따라 저장
    if len(existing_data) % SAVE_EVERY == 0 or idx == len(raw_data):
        with open(SAVE_PATH, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, indent=2, ensure_ascii=False)
        print(f"[{idx}/{len(raw_data)}] 저장 완료: {name}")

print(f"\n🎉 처리 완료 — 총 {len(existing_data)}건 저장됨")
