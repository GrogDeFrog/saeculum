import { setupEventListeners } from './events.js';
import { fetchUser, fetchPreviousEntries } from './api.js';
import { dom } from './dom.js';
import { store } from './store.js';

document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    dom.searchBar.focus();

    /* Initial data load */
    await fetchUser();
    await fetchPreviousEntries();
});
