import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { QdrantClient } from '@qdrant/js-client-rest';
import { EmbeddingsModule } from 'ubc-genai-toolkit-embeddings';
import { ConsoleLogger } from 'ubc-genai-toolkit-core';
import { randomUUID } from 'crypto';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 6340;

const qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});

let embeddingsModule;

async function setupEmbeddings() {
    try {
        const logger = new ConsoleLogger('tlef-qdrant-app');

        const llmConfig = {
            provider: process.env.LLM_PROVIDER,
            apiKey: process.env.LLM_API_KEY,
            endpoint: process.env.LLM_ENDPOINT,
            defaultModel: process.env.LLM_DEFAULT_MODEL,
            embeddingModel: process.env.LLM_EMBEDDING_MODEL,
        };

        const config = {
            providerType: process.env.EMBEDDING_PROVIDER,
            logger: logger,
            llmConfig: llmConfig,
        };

        embeddingsModule = await EmbeddingsModule.create(config);
        console.log('✅ Embeddings module initialized successfully.');
    } catch (error) {
        console.error('❌ Failed to initialize embeddings module:', error);
        process.exit(1);
    }
}

const collectionName = 'tlef_documents';
const vectorSize = 768; // Based on nomic-embed-text

async function setupQdrant() {
    try {
        const response = await qdrantClient.getCollections();
        const collectionNames = response.collections.map((collection) => collection.name);

        if (!collectionNames.includes(collectionName)) {
            await qdrantClient.createCollection(collectionName, {
                vectors: {
                    size: vectorSize,
                    distance: 'Cosine',
                },
            });
            console.log(`✅ Collection '${collectionName}' created.`);
        } else {
            console.log(`ℹ️ Collection '${collectionName}' already exists.`);
        }
    } catch (error) {
        console.error('❌ Qdrant setup failed:', error);
        process.exit(1);
    }
}

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// API Endpoints
app.post('/api/documents', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Text is required and must be a string.' });
        }

        const [embedding] = await embeddingsModule.embed(text);
        const id = randomUUID();
        const payload = { text, timestamp: new Date().toISOString() };

        await qdrantClient.upsert(collectionName, {
            wait: true,
            points: [
                {
                    id: id,
                    vector: embedding,
                    payload: payload,
                },
            ],
        });

        res.status(201).json({ id, payload });
    } catch (error) {
        console.error('Error creating document:', error);
        res.status(500).json({ error: 'Failed to create document.' });
    }
});

app.get('/api/documents', async (req, res) => {
    try {
        const response = await qdrantClient.scroll(collectionName, {
            with_payload: true,
            with_vector: false,
            limit: 100, // Adjust limit as needed
        });

        res.status(200).json(response.points);

    } catch (error) {
        console.error('Error retrieving documents:', error);
        res.status(500).json({ error: 'Failed to retrieve documents.' });
    }
});

app.delete('/api/documents/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'ID is required.' });
        }

        await qdrantClient.delete(collectionName, {
            points: [id],
        });

        res.status(200).json({ success: true, id });

    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: 'Failed to delete document.' });
    }
});

app.post('/api/search', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Query is required and must be a string.' });
        }

        const [queryVector] = await embeddingsModule.embed(query);

        const searchResults = await qdrantClient.search(collectionName, {
            vector: queryVector,
            limit: 5, // Return top 5 results
            with_payload: true,
        });

        res.status(200).json(searchResults);

    } catch (error) {
        console.error('Error searching documents:', error);
        res.status(500).json({ error: 'Failed to search documents.' });
    }
});


app.listen(port, async () => {
    await setupQdrant();
    await setupEmbeddings();
    console.log(`🚀 Server is running on http://localhost:${port}`);
});