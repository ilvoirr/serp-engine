from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote
import os

app = Flask(__name__)
CORS(app)

# HuggingFace API configuration
HF_API_KEY = os.getenv("HF_API_KEY")
HF_MODEL_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"

def perform_search(query, num_results=10):
    try:
        url = f"https://html.duckduckgo.com/html/?q={quote(query)}"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        results = []
        for a in soup.select("a.result__a")[:num_results]:
            title = a.get_text(strip=True)
            link = a.get("href", "")
            desc = ""
            desc_div = a.find_parent("div", class_="result__body")
            if desc_div:
                snippet = desc_div.find("a", class_="result__snippet")
                desc = snippet.get_text(strip=True) if snippet else desc_div.get_text(strip=True)
            results.append({"title": title, "link": link, "description": desc})
        return results
    except Exception as e:
        print(f"Error performing search: {e}")
        return []

def overview_with_huggingface(all_descriptions):
    try:
        text_to_summarize = "\n\n".join(all_descriptions)
        prompt = (
            f"Summarize the following search results in 3-4 sentences using natural, conversational language:\n\n"
            f"{text_to_summarize}"
        )
        
        headers = {
            "Authorization": f"Bearer {HF_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 100,
                "temperature": 0.3,
                "top_p": 0.9
            }
        }
        
        response = requests.post(HF_MODEL_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        if isinstance(data, list) and len(data) > 0:
            summary = data[0].get("generated_text", "Summary unavailable.")
            if summary.startswith(prompt):
                summary = summary.replace(prompt, "").strip()
            return summary if summary else "Summary unavailable."
        return "Summary unavailable."
    except Exception as e:
        print(f"Error generating overview: {e}")
        return "Overview generation failed."

@app.route('/search', methods=['POST'])
def search():
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        if not query:
            return jsonify({'error': 'Query parameter is required'}), 400
        print(f"Search query: {query}")
        results = perform_search(query, num_results=10)
        return jsonify({
            'query': query,
            'results': results,
            'count': len(results)
        }), 200
    except Exception as e:
        print(f"API error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/overview', methods=['POST'])
def overview():
    try:
        data = request.get_json()
        descriptions = [r.get("description", "") for r in data.get('results',[])]
        if not descriptions or sum([len(d) for d in descriptions]) < 10:
            return jsonify({'overview': 'Nothing to summarize.'}), 200
        summary = overview_with_huggingface(descriptions)
        return jsonify({'overview': summary}), 200
    except Exception as e:
        print(f"API error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'Server is running'}), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    app.run(debug=False, host='0.0.0.0', port=port)
