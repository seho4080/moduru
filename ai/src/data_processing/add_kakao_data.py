import ../kakao_maps_api
import os
import re
import json

# restaurant    spot
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, "..", "..", "data", "raw", "festival_data_embedding.json")
SAVE_PATH = os.path.join(BASE_DIR, "..", "..", "data", "raw", "festival_data_embedding1.json")
SAVE_EVERY = 1000

# 1. Load raw data
with open(JSON_PATH, encoding="utf-8") as f:
    raw_data = json.load(f)

# 2. Load saved data or start empty
if os.path.exists(SAVE_PATH):
    with open(SAVE_PATH, encoding="utf-8") as f:
        saved_data = json.load(f)
else:
    saved_data = []

# 3. Build link lookup for deduplication
link_to_saved_item = {item.get("link", ""): item for item in saved_data}
updated_data = saved_data.copy()

for idx, item in enumerate(raw_data, 1):
    link = item.get("link", "")
    saved_item = link_to_saved_item.get(link)

    # Skip if kakao data already exists for this link
    if saved_item and "kakao" in saved_item and saved_item["kakao"] is not None:
        continue

    # if saved_item and saved_item.get("x") is None:
    #     continue

    # Clean name: remove all [] () {} and content inside
    name = item.get("name", "")
    name = re.sub(r"[\[\(\{].*?[\]\)\}]", "", name).strip()
    address = item.get("address", "")
    address = re.sub(r"[\[\(\{].*?[\]\)\}]", "", address).strip()
    match = re.search(r"^(.+?\d+(?:-\d+)?)\b", address)
    cleaned_address = match.group(1) if match else address
    # match = re.match(r"^(.*?(도|특별시|광역시))\s(.*?시)?\s?(.*?구)?", address)
    # if match:
    #     cleaned_address = " ".join([x for x in match.groups() if x])
    # else:
    #     cleaned_address = address

    x = item.get("x", None)
    y = item.get("y", None)

    # xy_data = kakao_maps_api.search_xy(cleaned_address)
    # item["x"] = xy_data.get("x", None) if xy_data else None
    # item["y"] = xy_data.get("y", None) if xy_data else None
    # address = re.sub(r"\b\d{1,4}(?:-\d{1,4})?\b", "", address).strip()

    query = f"{address}"

    # Save kakao data or None if not found
    kakao_data = kakao_maps_api.search_data(query, x, y)
    if kakao_data:
        item["kakao"] = kakao_data
    else:
        item["kakao"] = None
        print(f"[{idx}/{len(raw_data)}] ❌ kakao data is null for: {name}")

    # Update or append
    if saved_item:
        for i, existing in enumerate(updated_data):
            if existing.get("link", "") == link:
                updated_data[i] = item
                break
    else:
        updated_data.append(item)

    # Update lookup dict too
    link_to_saved_item[link] = item

    # Save every SAVE_EVERY or last item
    if idx % SAVE_EVERY == 0 or idx == len(raw_data):
        with open(SAVE_PATH, "w", encoding="utf-8") as f:
            json.dump(updated_data, f, indent=2, ensure_ascii=False)
        print(f"[{idx}/{len(raw_data)}] ✅ Saved progress")

print(f"\n🎉 Done — Total saved items: {len(updated_data)}")
