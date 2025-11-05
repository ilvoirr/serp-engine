from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote

app = Flask(__name__)
CORS(app)

OLLAMA = "http://localhost:11434/api/generate"

def scrape_duckduckgo(query, num_results=10):
    """Scrape DuckDuckGo search results."""
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
        print(f"Error scraping DuckDuckGo: {e}")
        return []

def overview_with_ollama(all_descriptions):
    """Summarize all search results using tinyllama."""
    try:
        text_to_summarize = "\n\n".join(all_descriptions)
        prompt = (
            f"{text_to_summarize}\n\n"
            "Summarize the above in 3-4 sentences using natural, conversational language:"
        )
        response = requests.post(
            OLLAMA,
            json={
                "model": "tinyllama",
                "prompt": prompt,
                "stream": False,
                "temperature": 0.3,
                "num_predict": 100,
                "stop": ["\n\n", "Search results:", "Overview:"]  # Stop tokens
            },
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        summary = data.get("response", "").strip()
        
        # Post-process: Remove any prompt repetition
        if summary.startswith("Google AI Overview:"):
            summary = summary.replace("Google AI Overview:", "").strip()
        if summary.startswith("ONE short paragraph"):
            summary = summary.split("\n")[-1].strip()
        
        return summary if summary else "Summary unavailable."
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
        print(f"DuckDuckGo Search: {query}")
        results = scrape_duckduckgo(query, num_results=10)
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
        summary = overview_with_ollama(descriptions)
        return jsonify({'overview': summary}), 200
    except Exception as e:
        print(f"API error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'Server is running'}), 200

if __name__ == '__main__':
    print(" Starting Flask server on http://localhost:5001")
    print(" Connected to Ollama at http://localhost:11434")
    app.run(debug=True, host='0.0.0.0', port=5001)
