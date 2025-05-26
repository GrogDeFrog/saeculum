import { setupEventListeners }   from './events.js';
import { fetchPreviousEntries }  from './api.js';
import { dom }                   from './dom.js';

document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    dom.searchBar.focus();
    await fetchPreviousEntries();
});

