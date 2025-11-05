# SERP Engine with Local LLM Summarization

This project is a fully in-house Search Engine Results Page (SERP) engine that scrapes and structures search results without relying on any external APIs. It also features a lightweight, local Large Language Model (LLM) to summarize and categorize the search results.

## Problem Statement

- **Can you build your own Google Search API?** The goal is to create a self-contained SERP engine that fetches and organizes Google search results independently.
- **Can your tool summarize or categorize search results using a lightweight local LLM?** The project integrates a local LLM to provide concise summaries of the search results, demonstrating the power of local AI.

[![Watch the demo](https://img.youtube.com/vi/kUW-jdJp8o8/maxresdefault.jpg)](https://youtu.be/kUW-jdJp8o8)

## How It Works

The application is composed of three main components:

1. **Frontend**: A Next.js application that provides a clean, user-friendly interface for entering search queries and viewing results. It includes a dark mode toggle for user comfort.
2. **Backend**: A Python Flask server that handles the scraping of search results from Web and serves them to the frontend.
3. **Local LLM**: The backend leverages a locally running Ollama instance with the `tinyllama` model to generate summaries of the search results. This allows for powerful, offline AI capabilities without relying on external services.

## Getting Started

Follow these steps to set up and run the project on your local machine.

### Prerequisites

- [Node.js and npm](https://nodejs.org/)
- [Python 3](https://www.python.org/)
- [Ollama](https://ollama.ai/)

### Installation and Setup

1. **Clone the repository**:

    ```bash
    git clone <repository-url>
    cd serpengine_app
    ```

2. **Set up the Frontend**:

    ```bash
    cd serpengine
    npm install
    ```

3. **Set up the Backend**:

    ```bash
    cd ../python_backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```

4. **Set up the Local LLM**:

    Make sure Ollama is installed and running. Then, pull the `tinyllama` model:

    ```bash
    ollama pull tinyllama
    ```

### Running the Application

1. **Start the Backend Server**:

    In the `python_backend` directory, with the virtual environment activated, run:

    ```bash
    python app.py
    ```

    The backend server will start on `http://localhost:5001`.

2. **Start the Frontend Development Server**:

    In a new terminal, navigate to the `serpengine` directory and run:

    ```bash
    npm run dev
    ```

    The frontend application will be available at `http://localhost:3000`.

3. **Start the Local LLM**:

    Ensure the Ollama application is running in the background. The backend will automatically connect to it.

Now you can open your browser, navigate to `http://localhost:3000`, and start searching!