# TLEF Qdrant Example App

This project is a full-stack JavaScript application designed to demonstrate how to perform CRUD (Create, Read, Update, Delete) and search operations on a [Qdrant](https://qdrant.tech/) vector database.

It features a vanilla JavaScript frontend and an Express.js backend. The application allows users to input text, which is then converted into vector embeddings using the `nomic-embed-text` model (served via Ollama) and the `ubc-genai-toolkit-embeddings` library. These embeddings are then stored and searched within a local Qdrant instance.

This application serves as an educational tool for junior developers to understand the fundamentals of building a generative AI-powered application.

## Features

-   **Add Documents**: Input text to be converted into embeddings and stored in Qdrant.
-   **View Documents**: See a list of all documents currently in the database.
-   **Delete Documents**: Remove specific documents.
-   **Semantic Search**: Perform similarity searches on the stored documents based on a query.

## Tech Stack

-   **Frontend**: Vanilla JavaScript, HTML, CSS (No frameworks)
-   **Backend**: Node.js, Express.js
-   **Vector Database**: Qdrant
-   **Embeddings**: `nomic-embed-text` model via [Ollama](https://ollama.com/)
-   **Libraries**:
    -   `@qdrant/js-client-rest`
    -   `ubc-genai-toolkit-embeddings`
    -   `express`
    -   `dotenv`

## Prerequisites

Before you begin, ensure you have the following installed and running:

-   **Node.js**: `v18.x` or higher.
-   **Docker**: While this project doesn't manage it, you'll need Docker to run Qdrant.
-   **Qdrant**: A running instance of the Qdrant vector database. Please see the [Qdrant documentation](https://qdrant.tech/documentation/guides/installation/) for instructions on how to start a Qdrant service.
-   **Ollama**: With the `nomic-embed-text` model pulled (`ollama pull nomic-embed-text`).

## Setup & Running the App

1.  **Clone the Repository**:

    ```bash
    git clone <repository-url>
    cd tlef-qdrant-example-app
    ```

2.  **Install Dependencies**:

    ```bash
    npm install
    ```

3.  **Configure Environment**:

    Create a file named `.env` in the root of the project and add the following content. This file configures the connections to your running Qdrant and Ollama services.

    ```env
    # Application Port
    PORT=6340

    # Qdrant Configuration
    # URL for your running Qdrant instance
    QDRANT_URL=http://localhost:6333
    # API Key for your Qdrant instance
    QDRANT_API_KEY=super-secret-dev-key

    # --- Embeddings Provider Configuration ---
    # This specifies that we're using the LLM toolkit as the provider for embeddings
    EMBEDDING_PROVIDER=ubc-genai-toolkit-llm

    # --- LLM Provider Settings (for Embeddings) ---
    # We are using Ollama to serve the embedding model
    LLM_PROVIDER=ollama
    # The API key is not required for a local Ollama instance, but the field is expected
    LLM_API_KEY=nokey
    # The default local endpoint for the Ollama server
    LLM_ENDPOINT=http://localhost:11434
    # The specific model to use for generating embeddings
    LLM_EMBEDDING_MODEL=nomic-embed-text
    # A default model name is required by the LLM module for initialization.
    LLM_DEFAULT_MODEL=llama3.1
    ```

4.  **Start the Server**:
    This command starts the backend server using `nodemon`, which will automatically restart the server on file changes.

    ```bash
    npm run dev
    ```

    Once the server is running, you can access the application at **[http://localhost:6340](http://localhost:6340)**.

## How to Use the Application

-   **To add a document**: Type or paste text into the "Add New Document" text area and click the "Add Document" button.
-   **To search for documents**: Type a query into the "Search Documents" input field and click the "Search" button. The most similar documents will appear below.
-   **To delete a document**: Click the "Delete" button next to any document in the "All Documents" or "Search Results" lists.

## Project Structure

```
.
├── public/             # Frontend assets
│   ├── index.html      # Main HTML file
│   ├── style.css       # Stylesheet
│   └── script.js       # Client-side JavaScript
├── src/                # Backend source code
│   └── index.js        # Express server and API logic
├── .env                # (You create this) Environment variables
├── .gitignore          # Files to ignore for Git
├── docker-compose.yml  # Qdrant service definition
├── package.json        # Project dependencies and scripts
└── readme.md           # This file
```
