import json
import os
import modules.gms_api as gms_api

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_PATH = os.path.join(BASE_DIR, "..", "data", "restaurant_data.json")
OUTPUT_PATH = os.path.join(BASE_DIR, "..", "data", "restaurant_data_embedding.json")
SAVE_EVERY = 200

# 전체 원본 데이터
with open(INPUT_PATH, encoding="utf-8") as f:
    full_data = json.load(f)

# 기존 임베딩된 데이터 (없으면 빈 리스트로 초기화)
if os.path.exists(OUTPUT_PATH):
    with open(OUTPUT_PATH, encoding="utf-8") as f:
        embedded_data = json.load(f)
else:
    embedded_data = [{} for _ in range(len(full_data))]

# 데이터 길이 보정 (누락된 인덱스 채우기)
while len(embedded_data) < len(full_data):
    embedded_data.append({})

# null인 description_embedding만 재임베딩
for i, (original, embedded) in enumerate(zip(full_data, embedded_data)):
    if embedded.get("description_embedding") is not None:
        continue  # 이미 임베딩됨

    description = original.get("description", "")
    description += f"\n주소: {original.get('address', '')}"

    tags = original.get("tags")
    if tags and isinstance(tags, list):
        tag_text = ", ".join(tags)
        description += f"\n관련 태그: {tag_text}"

    try:
        embedding = gms_api.text_embedding(description)
        embedded["description_embedding"] = embedding
    except Exception as e:
        print(f"[{i + 1}] Embedding failed: {e}")
        embedded["description_embedding"] = None

    # 다른 필드도 embedded_data에 반영 (필요 시)
    for key in original:
        if key not in embedded:
            embedded[key] = original[key]

    if (i + 1) % SAVE_EVERY == 0 or i == len(full_data) - 1:
        with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
            json.dump(embedded_data, f, ensure_ascii=False, indent=2)
        print(f"[{i + 1}/{len(full_data)}] Saved")

print(f"\nFinal save complete: {OUTPUT_PATH}")
