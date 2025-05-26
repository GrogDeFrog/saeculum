import { dom }   from './dom.js';
import { store } from './store.js';
import { formatDuration, processDateString, ensureElementInView, fuzzySearch } from './utils.js';

export function displayCurrentEntry() {
    const e = store.currentEntry;
    if (!e) return;
    dom.currentTaskName.textContent = e.Description;
    const elapsed = Math.floor((Date.now() - new Date(e.StartTime)) / 1000);
    dom.currentTaskDuration.textContent = formatDuration(elapsed);
}

export function highlightEntry(idx) {
    if (idx >= store.numEntries) idx = store.numEntries;
    if (dom.entryList.childNodes[store.highlightedIndex])
        dom.entryList.childNodes[store.highlightedIndex].classList.remove('highlighted');

    store.highlightedIndex = idx;

    if (dom.entryList.childNodes[idx]) {
        dom.entryList.childNodes[idx].classList.add('highlighted');
        ensureElementInView(dom.entryList.childNodes[idx]);
    }
}

export function updateHighlight(direction) {
    let idx = store.highlightedIndex;
    if (direction === 'up'   && idx > 0)                        idx--;
    if (direction === 'down' && idx < store.filteredEntries.length - 1) idx++;
    highlightEntry(idx);
}

export function ghostTextUpdate() {
    const u = dom.searchBar.value;
    const f = store.filteredEntries[store.highlightedIndex];
    const suffix = f ? f.Description.substring(u.length) : '';
    dom.ghostText.innerHTML = `<span style="color:white;">${u}</span>${suffix}`;
}

export function displayEntries(list) {
    dom.entryList.innerHTML = '';
    if (!list.length) {
        dom.entryList.innerHTML = '<li>No entries found</li>';
        return;
    }

    // Exclude the newest "current" entry from the paginated slice
    const slice = [list[0], ...list.slice(store.numEntries * store.page + 1,
        store.numEntries * (store.page + 1) + 1)];

    slice.forEach((entry, idx) => {
        const li = document.createElement('li');
        li.dataset.index = idx;

        const dateDiv = Object.assign(document.createElement('div'), { className: 'date',
            textContent: processDateString(entry) });
        const durDiv  = Object.assign(document.createElement('div'), { className: 'duration',
            textContent: formatDuration(entry.Duration / 1e9) });
        const descDiv = Object.assign(document.createElement('div'), { className: 'description',
            textContent: entry.Description });
        const delDiv  = Object.assign(document.createElement('div'), { className: 'delete-button',
            textContent: '×' });

        li.append(dateDiv, durDiv, descDiv, delDiv);

        if (dateDiv.textContent === 'current') li.style.display = 'none';

        // Hover & click handlers
        li.addEventListener('mouseover', () => hoverHighlight(idx));
        li.addEventListener('click', ev => {
            if (ev.target.classList.contains('delete-button')) deleteEntry(entry);
            else startEntry(entry.Description);
        });

        dom.entryList.appendChild(li);
    });

    // Update fuzzy-filtered list and first highlight
    store.filteredEntries = store.searchActive
        ? fuzzySearch(dom.searchBar.value, list)
        : list;

    highlightEntry(0);
    ghostTextUpdate();
}

// helper for mouse hovering
export function hoverHighlight(idx) {
    highlightEntry(idx);
}

