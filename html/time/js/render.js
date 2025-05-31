import { dom }   from './dom.js';
import { store } from './store.js';
import { formatDuration, processDateString, ensureElementInView, fuzzySearch } from './utils.js';
import { deleteEntry, startEntry } from './api.js';

/* ========== CURRENT-TASK DISPLAY ========== */

let ticker = null;

export function startTicker() {
    stopTicker();
    displayCurrentEntry();
    ticker = setInterval(displayCurrentEntry, 1000);
}

export function stopTicker() {
    if (ticker) {
        clearInterval(ticker);
        ticker = null;
    }
}

export function resetCurrentTaskDisplay() {
    dom.currentTaskName.textContent     = 'No active task';
    dom.currentTaskDuration.textContent = '';
}

export function displayCurrentEntry() {
    const e = store.currentEntry;
    if (!e) return resetCurrentTaskDisplay();

    dom.currentTaskName.textContent = e.Description;
    const elapsed = Math.max(0, Math.floor((Date.now() - new Date(e.StartTime)) / 1000));
    dom.currentTaskDuration.textContent = formatDuration(elapsed);
    console.log("Displaying current entry.");
}

/* ========== AUTH BUTTON ========== */

export function updateTaskButton() {
    console.log("Task button updated.");
    dom.taskButton.textContent = !store.currentEntry || dom.searchBar.value ? 'Start' : 'End';
}

export function updateAuthButton() {
    dom.authButton.textContent = store.loggedIn ? 'Logout' : 'Login';
}

/* ========== LIST / SEARCH / HIGHLIGHT ========== */

export function highlightEntry(idx) {
    if (
        store.highlightedIndex !== -1 &&
        dom.entryList.childNodes[store.highlightedIndex]
    ) {
        dom.entryList.childNodes[store.highlightedIndex].classList.remove('highlighted');
    }

    store.highlightedIndex = idx;

    /* apply new highlight */
    if (idx !== -1 && dom.entryList.childNodes[idx]) {
        dom.entryList.childNodes[idx].classList.add('highlighted');
        ensureElementInView(dom.entryList.childNodes[idx]);
    }

    /* keep ghost text in sync */
    ghostTextUpdate();
    updateTaskButton();
}

export function updateHighlight(direction) {
    let idx = store.highlightedIndex;

    if (direction === 'down') {
        if (idx === -1 && store.filteredEntries.length) idx = 0;
        else if (idx < store.filteredEntries.length - 1 && idx < 19) idx++;
    } else if (direction === 'up') {
        if (idx >= 0) idx--;
    }

    highlightEntry(idx);
}

export function ghostTextUpdate() {
    console.log("Ghost text updated.");
    if (store.highlightedIndex === -1) {
        if (dom.searchBar.value) {
            if (store.entries.length)
                highlightEntry(0);
            else
                dom.ghostText.textContent = '';
        } else if (store.currentEntry) {
            dom.ghostText.textContent = store.currentEntry.Description;
        } else {
            dom.ghostText.textContent = '';
        }
        return;
    }

    /* Highlighted entry show autocomplete suffix */
    const u       = dom.searchBar.value;
    const f       = store.filteredEntries[store.highlightedIndex];
    const suffix  = f ? f.Description.substring(u.length) : '';
    dom.ghostText.innerHTML = `<span style="color:white;">${u}</span>${suffix}`;
}

export function displayEntries(list) {
    dom.entryList.innerHTML = '';
    if (!list.length) {
        dom.entryList.innerHTML = '<li>No entries found</li>';
        return;
    }

    const slice = list.slice(
        store.numEntries * store.page,
        store.numEntries * (store.page + 1),
    );

    slice.forEach((entry, idx) => {
        const li  = document.createElement('li');
        li.dataset.index = idx;

        const dateDiv = Object.assign(document.createElement('div'), {
            className:  'date',
            textContent: processDateString(entry),
        });

        const durSec = (new Date(entry.EndTime) - new Date(entry.StartTime)) / 1000;
        const durDiv = Object.assign(document.createElement('div'), {
            className:  'duration',
            textContent: formatDuration(durSec),
        });

        const descDiv = Object.assign(document.createElement('div'), {
            className:  'description',
            textContent: entry.Description,
        });

        const delDiv = Object.assign(document.createElement('div'), {
            className:  'delete-button',
            textContent: '×',
        });

        li.append(dateDiv, durDiv, descDiv, delDiv);

        /* mouse interactions */
        li.addEventListener('mouseover', () => hoverHighlight(idx));
        li.addEventListener('click', ev => {
            if (ev.target.classList.contains('delete-button')) deleteEntry(entry);
            else startEntry(entry.Description);
        });

        dom.entryList.appendChild(li);
    });

    /* fuzzy-search cache & initial highlight (-1 = none) */
    store.filteredEntries = store.searchActive
        ? fuzzySearch(dom.searchBar.value, list)
        : list;

    highlightEntry(-1);
}

export const hoverHighlight = idx => highlightEntry(idx);
