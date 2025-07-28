import os
import requests
import json
from dotenv import load_dotenv


load_dotenv()
gms_key = os.getenv("GMS_KEY")

url = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/chat/completions"
headers = {"Content-Type": "application/json", "Authorization": f"Bearer {gms_key}"}
data = {
    "model": "gpt-4.1-mini",
    "messages": [
        {"role": "system", "content": "Answer in Korean"},
        {"role": "user", "content": "Recommend 3dyas trip schedules in Daejeon"},
    ],
    "max_tokens": 4096,
    "temperature": 0.3,
}

response = requests.post(url, headers=headers, data=json.dumps(data))
print(response.status_code)
print(response.json())

print(gms_key)
