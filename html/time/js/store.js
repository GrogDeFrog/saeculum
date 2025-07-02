export const store = {
    /* paging & lists */
    numEntries: 20,
    entries: [],
    filteredEntries: [],
    highlightedIndex: -1,

    /* auth & profile */
    loggedIn: false,
    user: null,

    /* running task */
    currentEntry: null,
    currentEntryInterval: null,
};
