import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "..", "data", "raw", "spot_data.json")

# 데이터 불러오기
with open(DATA_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

# x 값이 None인 항목 제거
filtered_data = [item for item in data if item.get("kakao") is not None]

# 필터링된 데이터 저장
with open(DATA_PATH, "w", encoding="utf-8") as f:
    json.dump(filtered_data, f, indent=2, ensure_ascii=False)

print(f"✅ 필터링 완료: {len(filtered_data)}개 남음")
