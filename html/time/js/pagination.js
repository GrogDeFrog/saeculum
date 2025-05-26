import { dom }   from './dom.js';
import { store } from './store.js';
import { displayEntries } from './render.js';

export function pageFirst()  { store.page = 0;                            update(); }
export function pageBack()   { store.page = Math.max(0, store.page - 1);  update(); }
export function pageForward(){ store.page = Math.min(last(), store.page + 1); update(); }
export function pageLast()   { store.page = last();                       update(); }

function last() {
    return Math.floor(store.entries.length / store.numEntries);
}
function update() {
    dom.pageNumber.textContent = store.page + 1;
    displayEntries(store.entries);
}
