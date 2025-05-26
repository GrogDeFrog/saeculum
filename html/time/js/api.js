import { store }   from './store.js';
import { displayEntries, displayCurrentEntry } from './render.js';

export async function fetchPreviousEntries() {
    try {
        const res  = await fetch('/api/entries');
        store.entries = await res.json();

        if (store.entries.length) {
            displayEntries(store.entries);
            store.currentEntry = store.entries[0];
            restartTicker();
        } else {
            resetCurrentTaskDisplay();
            displayEntries([]);
        }

        // Build task-autocomplete list
        store.entries.forEach(e => {
            if (!store.tasks.find(t => t.Description === e.Description))
                store.tasks.push(e);
        });
    } catch (err) {
        console.error('fetchPreviousEntries:', err);
    }
}

export async function startEntry(description) {
    try {
        const res = await fetch('/api/start', {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({ Description: description }),
        });
        store.currentEntry = await res.json();
        restartTicker();
        await fetchPreviousEntries();          // refresh list
    } catch (err) {
        console.error('startEntry:', err);
    }
}

export async function deleteEntry(entry) {
    try {
        await fetch('/api/delete', {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({ ID: entry.ID }),
        });
        await fetchPreviousEntries();
    } catch (err) {
        console.error('deleteEntry:', err);
    }
}

export async function endCurrentEntry() {
    try {
        await fetch('/api/end', { method: 'POST' });
        await fetchPreviousEntries();
    } catch (err) {
        console.error('endCurrentEntry:', err);
    }
}

/* internal helpers */
function resetCurrentTaskDisplay() {
    document.getElementById('current-task-name').textContent = 'No active task';
    document.getElementById('current-task-duration').textContent = '';
}

function restartTicker() {
    if (store.currentEntryInterval) clearInterval(store.currentEntryInterval);
    displayCurrentEntry();
    store.currentEntryInterval = setInterval(displayCurrentEntry, 1000);
}

