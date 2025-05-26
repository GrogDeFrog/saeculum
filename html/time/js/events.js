import { dom }                 from './dom.js';
import { store }               from './store.js';
import { startEntry, deleteEntry, endCurrentEntry, fetchPreviousEntries } from './api.js';
import { updateHighlight, ghostTextUpdate } from './render.js';
import { fuzzySearch }         from './utils.js';
import { pageFirst, pageBack, pageForward, pageLast } from './pagination.js';

export function setupEventListeners() {
    /* Search bar live-filter */
    dom.searchBar.addEventListener('input', () => {
        store.searchActive   = !!dom.searchBar.value;
        store.filteredEntries = fuzzySearch(dom.searchBar.value, store.entries);
        updateHighlight('none');
    });

    /* Global key handling */
    document.addEventListener('keydown', e => {
        dom.searchBar.focus();
        if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
            e.preventDefault();
            updateHighlight(e.key === 'ArrowUp' ? 'up' : 'down');
        } else if (e.key === 'Tab') {
            e.preventDefault();
            autocompleteSuggestion();
        } else if (e.key === 'Enter') {
            startEntrySearchBar();
        }
        ghostTextUpdate();
    });

    /* Buttons */
    dom.startButton.addEventListener('click', startEntrySearchBar);
    dom.endButton.addEventListener('click',  endCurrentEntry);
    dom.loginButton.addEventListener('click', () => (window.location.href = '/login'));

    dom.pageFirstButton.addEventListener('click', pageFirst);
    dom.pageBackButton .addEventListener('click', pageBack);
    dom.pageForwardButton.addEventListener('click', pageForward);
    dom.pageLastButton .addEventListener('click', pageLast);
}

/* ============ Local helpers ============ */
function startEntrySearchBar() {
    const v = dom.searchBar.value.trim();
    if (v) { startEntry(v); dom.searchBar.value = ''; }
}

function autocompleteSuggestion() {
    const idx  = store.highlightedIndex;
    const sugg = store.filteredEntries[idx];
    if (!sugg) return;
    dom.searchBar.value = sugg.Description;
    dom.searchBar.dispatchEvent(new Event('input', { bubbles: true }));
}

