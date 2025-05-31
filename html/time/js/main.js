import { setupEventListeners } from './events.js';
import { fetchUser, fetchPreviousEntries } from './api.js';
import { updateAuthButton, updateTaskButton } from './render.js';
import { dom } from './dom.js';
import { store } from './store.js';

document.addEventListener('DOMContentLoaded', async () => {
    await fetchUser();
    await fetchPreviousEntries();

    setupEventListeners();
    dom.searchBar.focus();
});
