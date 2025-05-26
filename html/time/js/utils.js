import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2';
import { dom }   from './dom.js';
import { store } from './store.js';

export function formatDuration(seconds) {
    const pad = v => v.toString().padStart(2, '0');
    const h = pad(Math.floor(seconds / 3600));
    const m = pad(Math.floor((seconds % 3600) / 60));
    const s = pad(Math.round(seconds % 60));
    return `${h}:${m}:${s}`;
}

export function processDateString(entry) {
    const end = entry.EndTime;
    if (end === '0001-01-01T00:00:00Z') return 'current';

    const diffMs  = new Date() - new Date(end);
    const diffHrs = Math.floor(diffMs / 36e5);
    if (diffHrs < 96) return `${diffHrs} hours ago`;
    return `${Math.floor(diffHrs / 24)} days ago`;
}

export function fuzzySearch(term, entries) {
    if (!term) return entries;
    const fuse     = new Fuse(entries, { keys: ['Description'], threshold: 0.3 });
    const results  = fuse.search(term);
    return results.map(r => r.item);
}

export function ensureElementInView(elem) {
    const listRect = dom.entryList.getBoundingClientRect();
    const elRect   = elem.getBoundingClientRect();
    if (elRect.top < listRect.top)
        dom.entryList.scrollTop -= listRect.top - elRect.top;
    else if (elRect.bottom > listRect.bottom)
        dom.entryList.scrollTop += elRect.bottom - listRect.bottom;
}

