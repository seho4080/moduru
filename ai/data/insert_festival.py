import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "festival_data_embedding.json")


def clean_image_urls(image_list):
    cleaned = []
    for url in image_list:
        url = url.strip('"')
        url = url.replace("\\", "")
        # NOTE: VisitKorea CDN 경로 중 일부가 '/db/400_' 형태로 오는데, 원본 파일은 '/db/' 경로에 있음
        url = url.replace("/db/400_", "/db/")
        cleaned.append(url)
    return cleaned


# 파일 읽기
with open(DATA_PATH, encoding="utf-8") as f:
    data = json.load(f)

for item in data:
    item["images"] = clean_image_urls(item["images"])

with open(DATA_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)




