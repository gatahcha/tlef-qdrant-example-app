document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api';
    // --- Form Elements ---
    const addDocumentForm = document.getElementById('add-document-form');
    const newDocumentText = document.getElementById('new-document-text');
    const addDocumentBtn = addDocumentForm.querySelector('button');
    const searchForm = document.getElementById('search-form');
    const searchQueryText = document.getElementById('search-query-text');

    // --- List Containers ---
    const searchResultsContainer = document.getElementById('search-results');
    const allDocumentsContainer = document.getElementById('all-documents');

    // --- Corpus configuration ---
    const corpusConfigbtn = document.getElementById('configure-corpus-btn');
    const corpusConfigContainer = document.getElementById('configure-corpus-form');
    const corpusConfigSubmit = document.getElementById('configure-corpus-submit-button');
    const chunkingSizeColumn = document.getElementById('chunking-size');
    const overlapSizeColumn = document.getElementById('overlap-size');

    let corpusConfig = {
        chunkingSize: 10,
        overlapSize: 10
    }

    const fetchCorpusInfo = async () => {
        //fetch data about chunking sizer and overlap size
        const responseConfig = await fetch(`${API_BASE_URL}/documents/corpus-configuration`, {
            method : 'GET',
            headers : { 'Content-type' : 'application/json'},
        });
        if (!responseConfig.ok) throw new Error('Failed to fetch corpus config');

        try {
            const result = await responseConfig.json();
            console.log(result.config);
            corpusConfig.chunkingSize = parseInt(result.config.chunkingSize);
            corpusConfig.overlapSize = parseInt(result.config.overlapSize);
        }
        catch (e){
            console.error("response config error : ", e)
        }

    }


    // --- Helper Functions ---
    const showPlaceholder = (container, message) => {
        container.innerHTML = `<li class="placeholder">${message}</li>`;
    };

    const createDocumentElement = (doc, isSearchResult = false) => {
        const li = document.createElement('li');
        li.dataset.id = doc.id;

        const textContent = doc.payload.text || '[No text content]';
        const timestamp = new Date(doc.payload.timestamp).toLocaleString();
        const score = doc.score;

        let scoreHTML = '';
        if (isSearchResult && score !== undefined) {
            scoreHTML = `<div class="document-score">Score: ${score.toFixed(4)}</div>`;
        }

        const deleteButtonHTML = isSearchResult ? '' : `<button class="delete-btn" aria-label="Delete document">&times;</button>`;

        li.innerHTML = `
            <div class="document-text">
                ${textContent}
                <div class="document-meta">Added: ${timestamp}</div>
                ${scoreHTML}
            </div>
            ${deleteButtonHTML}
        `;
        return li;
    };

    const renderDocuments = (container, documents, isSearchResult = false) => {
        container.innerHTML = '';
        if (!documents || documents.length === 0) {
            const message = isSearchResult ? 'No results found for your query.' : 'No documents in the database. Add one!';
            showPlaceholder(container, message);
            return;
        }

        documents.forEach(doc => {
            const li = createDocumentElement(doc, isSearchResult);
            container.appendChild(li);
        });
    };

    const fetchAndRenderAllDocuments = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/documents`);
            if (!response.ok) throw new Error('Failed to fetch documents');
            const documents = await response.json();
            renderDocuments(allDocumentsContainer, documents);

        } catch (error) {
            console.error('Error fetching documents:', error);
            showPlaceholder(allDocumentsContainer, 'Error loading documents.');
        }
    };

    // --- Event Listeners ---

    newDocumentText.addEventListener('input', () => {
        addDocumentBtn.disabled = newDocumentText.value.trim() === '';
    });

    addDocumentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = newDocumentText.value.trim();
        if (!text) return;

        addDocumentBtn.disabled = true;
        addDocumentBtn.textContent = 'Adding...';

        try {
            const response = await fetch(`${API_BASE_URL}/documents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            if (!response.ok) throw new Error('Failed to add document');

            const newDocument = await response.json();

            newDocumentText.value = '';
            addDocumentBtn.disabled = true;

            const placeholder = allDocumentsContainer.querySelector('.placeholder');
            if (placeholder) {
                placeholder.remove();
            }

            const documentChunks = newDocument.points; // look at here

            for (const chunk of documentChunks){
                console.log(chunk)
                const li = createDocumentElement(chunk, false);
                li.classList.add('item-entering');
                li.addEventListener('animationend', () => {
                    li.classList.remove('item-entering');
                }, { once: true });

                allDocumentsContainer.prepend(li);
            }

        } catch (error) {
            console.error('Error adding document:', error);
            alert('Failed to add document.');
        } finally {
            addDocumentBtn.textContent = 'Add Document';
        }
    });

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = searchQueryText.value.trim();
        if (!query) {
            renderDocuments(searchResultsContainer, []);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query }),
            });

            if (!response.ok) throw new Error('Search request failed');
            const results = await response.json();
            renderDocuments(searchResultsContainer, results, true);
        } catch (error) {
            console.error('Error searching:', error);
            showPlaceholder(searchResultsContainer, 'Error performing search.');
        }
    });

    allDocumentsContainer.addEventListener('click', async (e) => {
        if (!e.target.classList.contains('delete-btn')) return;

        const li = e.target.closest('li');
        if (!li) return;
        const documentId = li.dataset.id;

        if (!confirm('Are you sure you want to delete this document?')) return;

        li.classList.add('item-exiting');
        li.addEventListener('animationend', async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Failed to delete document');

                li.remove();
                if (allDocumentsContainer.children.length === 0) {
                    showPlaceholder(allDocumentsContainer, 'No documents in the database. Add one!');
                }
            } catch (error) {
                console.error('Error deleting document:', error);
                alert('Failed to delete document.');
                li.classList.remove('item-exiting');
            }
        }, { once: true });
    });

    corpusConfigbtn.addEventListener('click', (e) => {
        e.preventDefault();

        if ( corpusConfigContainer.style.display === 'none') {
            fetchCorpusInfo()
                .then( () => {
                    chunkingSizeColumn.value = corpusConfig.chunkingSize;
                    overlapSizeColumn.value = corpusConfig.overlapSize;
                    console.log(corpusConfig);
                    corpusConfigContainer.style.display = 'flex';
                    corpusConfigbtn.textContent = 'Hide configuration';
                } );
        }
        else {
            corpusConfigContainer.style.display = 'none';
            corpusConfigbtn.textContent = 'Edit configuration';
        }
    })

    corpusConfigSubmit.addEventListener('click', async (e) => {
        e.preventDefault();

        const config = {
            chunkingSize : chunkingSizeColumn.value.trim(),
            overlapSize : overlapSizeColumn.value.trim()
        };

        try {
            const response = await fetch(`${API_BASE_URL}/documents/corpus-configuration`, {
                method : 'POST',
                headers : { 'Content-type' : 'application/json'},
                body : JSON.stringify({config})
            });
            if (!response.ok) throw new Error("failed to change corpus configuration"); // why this response failed
            else {
                const result = await response.json();
                corpusConfig.chunkingSize = result.chunkingSize;
                corpusConfig.overlapSize = result.overlapSize;
            }
        }
        catch (error) {
            console.error('error modifiying chungking size : ', error);
            alert(error);
        } 
    })

    // --- Initial Load ---
    showCorpusConfig = false;
    fetchCorpusInfo();
    fetchAndRenderAllDocuments();
    showPlaceholder(searchResultsContainer, 'Search results will appear here.');
});