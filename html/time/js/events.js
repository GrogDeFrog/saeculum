import { dom }   from './dom.js';
import { store } from './store.js';
import { displayEntries, updateTaskButton, updateHighlight, highlightEntry, ghostTextUpdate } from './render.js';
import { startEntry, deleteEntry, endCurrentEntry, fetchPreviousEntries } from './api.js';
import { pageFirst, pageBack, pageForward, pageLast } from './pagination.js';
import { fuzzySearch } from './utils.js';

/* ============  Public setup  ============ */

export function setupEventListeners() {
    updateTaskButton();
    /* Live search */
    dom.searchBar.addEventListener('input', () => {
        const q = dom.searchBar.value.trim();

        /* search-state bookkeeping */
        store.searchActive = q.length > 0;
        store.page = 0;

        /* run fuzzy search and choose which list to show */
        store.filteredEntries = store.searchActive
            ? fuzzySearch(q, store.entries)
            : store.entries;

        /* repaint list with just the matches (or all entries if blank) */
        displayEntries(store.filteredEntries);

        ghostTextUpdate();
        updateTaskButton();
    });

    /* Global key handling */
    document.addEventListener('keydown', e => {
        /* keep focus in the search bar */
        dom.searchBar.focus();

        switch (e.key) {
            case 'ArrowDown':
            case 'ArrowUp':
                e.preventDefault();
                updateHighlight(e.key === 'ArrowUp' ? 'up' : 'down');
                break;

            case 'Tab':
                e.preventDefault();
                autocompleteSuggestion();
                break;

            case 'Enter':
                startEntryFromSearchBar();
                break;
        }

        ghostTextUpdate();
        updateTaskButton();
    });

    /* Buttons */
    dom.taskButton.addEventListener('click', () => {
        !store.currentEntry || dom.searchBar.value ? startEntryFromSearchBar() : endCurrentEntry();
    });
    dom.authButton .addEventListener('click', () => {
        window.location.href = store.loggedIn ? '/auth/logout' : '/auth/login';
    });

    dom.pageFirstButton  .addEventListener('click', pageFirst);
    dom.pageBackButton   .addEventListener('click', pageBack);
    dom.pageForwardButton.addEventListener('click', pageForward);
    dom.pageLastButton   .addEventListener('click', pageLast);
}

/* ============  Local helpers  ============ */

function startEntryFromSearchBar() {
    const v = dom.searchBar.value.trim();
    if (!v) return;
    startEntry(v);
    dom.searchBar.value = '';
}

function autocompleteSuggestion() {
    const idx = store.highlightedIndex;
    if (idx === -1) {
        if (!store.currentEntry) return;
        dom.searchBar.value = store.currentEntry.Description;
    }
    else {
        if (!store.filteredEntries[idx]) return;
        dom.searchBar.value = store.filteredEntries[idx].Description;
    }
    dom.searchBar.dispatchEvent(new Event('input', { bubbles: true }));
}

