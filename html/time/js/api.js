import { store } from './store.js';
import {
    displayEntries,
    startTicker,
    stopTicker,
    resetCurrentTaskDisplay,
    updateAuthButton,
    updateTaskButton,
    ghostTextUpdate,
} from './render.js';

/* =============== PUBLIC =============== */

export async function fetchUser() {
    try {
        const res = await fetch('/user');
        if (res.status === 401) return setLoggedOut();

        store.user     = await res.json();
        store.loggedIn = true;

        if (store.user.current_task) {
            store.currentEntry = {
                Description: store.user.current_task.description,
                StartTime:   store.user.current_task.start_time,
            };
            startTicker();
        } else {
            store.currentEntry = null;
            resetCurrentTaskDisplay();
        }

        ghostTextUpdate();
        updateAuthButton();
        updateTaskButton();
    } catch (err) {
        console.error('fetchUser:', err);
    }
}

export async function fetchPreviousEntries() {
    try {
        const res     = await fetch('/entries');
        store.entries = await res.json();
        displayEntries(store.entries);
    } catch (err) {
        console.error('fetchPreviousEntries:', err);
    }
}

export async function startEntry(description) {
    try {
        await fetch('/entries/start', {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({ description }),
        });
        await Promise.all([fetchUser(), fetchPreviousEntries()]);
    } catch (err) {
        console.error('startEntry:', err);
    }
    ghostTextUpdate();
    updateTaskButton();
}

export async function deleteEntry(entry) {
    try {
        await fetch('/entries/delete', {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({ entry_id: entry.ID }),
        });
        await fetchPreviousEntries();
    } catch (err) {
        console.error('deleteEntry:', err);
    }
    ghostTextUpdate();
    updateTaskButton();
}

export async function endCurrentEntry() {
    try {
        await fetch('/entries/end', { method: 'POST' });
        await Promise.all([fetchUser(), fetchPreviousEntries()]);
    } catch (err) {
        console.error('endCurrentEntry:', err);
    }
    ghostTextUpdate();
    updateTaskButton();
}

/* =============== INTERNAL =============== */

function setLoggedOut() {
    store.loggedIn     = false;
    store.user         = null;
    store.currentEntry = null;

    stopTicker();
    resetCurrentTaskDisplay();
    updateAuthButton();
    ghostTextUpdate();
    updateTaskButton();
}

