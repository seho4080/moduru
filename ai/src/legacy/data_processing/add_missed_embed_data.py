import json
import os
import modules.gms_api as gms_api

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "..", "data", "spot_data_embedding.json")
SAVE_EVERY = 200

# 파일 열기
with open(DATA_PATH, encoding="utf-8") as f:
    data = json.load(f)

updated = False
count = 0

for i, item in enumerate(data):
    if item.get("description_embedding") is not None:
        continue

    description = item.get("description", "")
    description += f"\n주소: {item.get('address', '')}"

    tags = item.get("tags")
    if tags and isinstance(tags, list):
        tag_text = ", ".join(tags)
        description += f"\n관련 태그: {tag_text}"

    try:
        item["description_embedding"] = gms_api.text_embedding(description)
        print(f"[{i + 1}] Embedding complete")
    except Exception as e:
        print(f"[{i + 1}] Embedding failed: {e}")
        item["description_embedding"] = None

    count += 1
    updated = True

    if count % SAVE_EVERY == 0:
        with open(DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"[{i + 1}] Saved {count} updated entries")

# 최종 저장
if updated:
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\nFinal save complete: {DATA_PATH}")
else:
    print("\nNo entries needed updating.")
