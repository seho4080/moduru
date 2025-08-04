import json
import os
import gms_api

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_PATH = os.path.join(BASE_DIR, "..", "..", "data", "raw", "restaurant_data.json")
OUTPUT_PATH = os.path.join(BASE_DIR, "..", "..", "data", "raw", "restaurant_data_embedding.json")
SAVE_EVERY = 2000
START_INDEX = 0

# 전체 데이터 불러오기
with open(INPUT_PATH, encoding="utf-8") as f:
    full_data = json.load(f)

# 기존 임베딩된 데이터 불러오기 (없으면 빈 리스트)
if os.path.exists(OUTPUT_PATH):
    with open(OUTPUT_PATH, encoding="utf-8") as f:
        embedded_data = json.load(f)
else:
    embedded_data = []

# 지정한 인덱스부터 시작
for i, item in enumerate(full_data[START_INDEX:], start=START_INDEX + 1):
    description = item.get("description")
    tags = item.get("tags")

    if description:
        # 태그를 description 뒤에 추가
        if tags and isinstance(tags, list):
            tag_text = ", ".join(tags)
            description += f"\n관련 태그: {tag_text}"

        try:
            item["description_embedding"] = gms_api.text_embedding(description)
        except Exception as e:
            print(f"[{i}] Embedding failed: {e}")
            item["description_embedding"] = None
    else:
        item["description_embedding"] = None

    embedded_data.append(item)

    if i % SAVE_EVERY == 0 or i == len(full_data):
        with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
            json.dump(embedded_data, f, ensure_ascii=False, indent=2)
        print(f"[{i}/{len(full_data)}] Saved")

print(f"\nFinal save complete: {OUTPUT_PATH}")
