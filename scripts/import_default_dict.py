import json
import urllib.request
import time

# Config
DB_URL = "https://benodict-default-rtdb.europe-west1.firebasedatabase.app/shared/dictionaries/dict2500.json"

try:
    with open('dict2500.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    results = data.get('results', [])
    processed_words = {}

    for i, item in enumerate(results):
        word = item.get('word', '')
        means = item.get('means', {})
        
        translations = []
        for part, text in sorted(means.items()):
            if text and text.strip():
                translations.append(f"[{part}] {text}")
        
        translation_str = "; ".join(translations)
        
        word_id = f"word_{i:04d}" # Zero-padded for sorting
        processed_words[word_id] = {
            "original": word,
            "translation": translation_str,
            "transcription": item.get('transcription', ''),
            "popularity": item.get('popular', 0),
            "number": item.get('number', 0)
        }

    upload_data = {
        "info": {
            "name": "English 2500 (Default)",
            "sourceLang": "en",
            "targetLang": "ru",
            "wordCount": len(results),
            "createdAt": int(time.time() * 1000)
        },
        "words": processed_words
    }

    json_data = json.dumps(upload_data).encode('utf-8')
    req = urllib.request.Request(DB_URL, data=json_data, method='PUT')
    req.add_header('Content-Type', 'application/json')

    print(f"Uploading {len(results)} words to {DB_URL}...")
    with urllib.request.urlopen(req) as response:
        print("Status code:", response.status)
        print("Success!")
except Exception as e:
    print("Error during import:", e)
