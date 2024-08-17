document.addEventListener('DOMContentLoaded', function() {
    const numEntries = 20;
    var page = 0;
    var searchBar = document.getElementById('search-bar');
    var entryList = document.getElementById('entry-list');
    var ghostText = document.getElementById('ghost-text');
    var filteredEntries = [];
    var tasks = [];
    var commonTasksContainer = document.getElementById('task-container');
    let entries = [];
    let highlightedIndex = -1;

    searchBar.value = "";
    var currentEntry = null;
    var currentEntryInterval = null;

    function displayCurrentEntry() {
        if (currentEntry) {
            document.getElementById('current-task-name').textContent = currentEntry.Description;
            const elapsedTime = Math.floor((new Date() - new Date(currentEntry.StartTime)) / 1000);
            document.getElementById('current-task-duration').textContent = formatDuration(elapsedTime);
        }

    }

    function processDateString(data) {
        const endTime = data.EndTime;
        if (endTime === '0001-01-01T00:00:00Z') {
            return 'current';
        } else {
            const endDate = new Date(endTime);
            const now = new Date();
            const diff = now - endDate;
            const diffInHours = Math.floor(diff / (1000 * 60 * 60));
            const diffInDays = Math.floor(diffInHours / 24);

            if (diffInHours < 96) {
                return `${diffInHours} hours ago`;
            } else {
                return `${diffInDays} days ago`;
            }
        }
    }

    function formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const sec = Math.round((seconds % 60)).toString().padStart(2, '0');
        return `${hours}:${minutes}:${sec}`;
    }

function fetchPreviousEntries() {
    fetch('/api/entries')
        .then(response => response.json())
        .then(data => {
            entries = data;

            if (entries.length > 0) {
                displayEntries(entries);
                currentEntry = entries[0];

                if (currentEntryInterval) {
                    clearInterval(currentEntryInterval);
                }
                currentEntryInterval = setInterval(displayCurrentEntry, 1000);
                displayCurrentEntry();
            } else {
                // Handle the case when there are no entries
                document.getElementById('current-task-name').textContent = 'No active task';
                document.getElementById('current-task-duration').textContent = '';
                entryList.innerHTML = '<li>No entries found</li>';
            }

            entries.forEach(entry => {
                if (!tasks.find(task => task.Description === entry.Description)) {
                    tasks.push(entry);
                }
            });
        })
        .catch(error => console.error('Error:', error));
}

    function displayEntries(entries) {
        entryList.innerHTML = '';

            
        if (entries.length === 0) {
            entryList.innerHTML = '<li>No entries found</li>';
            return;
        }


        [entries[0], ...entries.slice(numEntries * page + 1, numEntries * (page + 1) + 1)].forEach((entry, index) => {
            var dateString = processDateString(entry);
            var duration = formatDuration(entry.Duration/1000000000);

            const li = document.createElement('li');

            const dateDiv = document.createElement('div');
            dateDiv.classList.add('date');
            dateDiv.textContent = dateString;

            const durationDiv = document.createElement('div');
            durationDiv.classList.add('duration');
            durationDiv.textContent = duration;

            const descriptionDiv = document.createElement('div');
            descriptionDiv.classList.add('description');
            descriptionDiv.textContent = entry.Description;

            li.appendChild(dateDiv);
            li.appendChild(durationDiv);
            li.appendChild(descriptionDiv);

            li.dataset.index = index;

            // Hide newest task
            if (dateString === 'current') {
                li.style.display = 'none';
            }

            // Mouseover to highlight
            li.addEventListener('mouseover', function() {
                hoverHighlight(index);
            });

            li.addEventListener('click', function() {
                startEntry(entry.Description);
            });

            entryList.appendChild(li);
        });
        if (entries.length === 0) {
            return;
        }
        const searchTerm = searchBar.value;
        filteredEntries = fuzzySearch(searchTerm,entries);
        if(searchTerm === ""){
            filteredEntries = entries;
        }

        highlightEntry(0);
        ghostTextUpdate();
    }

    function toggleVisibility(className) {
        const elements = document.querySelectorAll(`li .${className}`);
        elements.forEach(element => {
            if (element.style.display === 'none') {
                element.style.display = 'block';
            } else {
                element.style.display = 'none';
            }
        });
    }

    function highlightEntry(index) {
        if (index > numEntries)
            index = numEntries;

        if (entryList.childNodes[highlightedIndex]) {
            entryList.childNodes[highlightedIndex].classList.remove('highlighted');
        }
        highlightedIndex = index;
        if (entryList.childNodes[highlightedIndex]) {
            entryList.childNodes[highlightedIndex].classList.add('highlighted');
            ensureElementInView(entryList.childNodes[highlightedIndex]);
        }
    }

    function ensureElementInView(element) {
        const listRect = entryList.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        if (elementRect.top < listRect.top) {
            entryList.scrollTop -= listRect.top - elementRect.top;
        } else if (elementRect.bottom > listRect.bottom) {
            entryList.scrollTop += elementRect.bottom - listRect.bottom;
        }
    }

    function updateHighlight(direction) {
        let newIndex = highlightedIndex;
        if (direction === 'up' && highlightedIndex > 0) {
            newIndex--;
        } else if (direction === 'down' && highlightedIndex < entries.length - 1) {
            newIndex++;
        }
        highlightEntry(newIndex);
    }

    function fuzzySearch(searchTerm, entries) {
        const options = {
            // The keys in the entries objects to search in
            keys: ['Description'],
            // Other options can be set here (e.g., threshold for matching)
            includeScore: true, // This is optional, it includes the match score
            threshold: 0.3 // Lower means more strict matching
        };
        const fuse = new Fuse(entries, options);
        const result = fuse.search(searchTerm);
        return result.map(item => item.item); // Return the matched entries
    }

    function ghostTextUpdate(){
        var userInput = searchBar.value;
        var autoComplete = "";
        if (filteredEntries != "") {
            autoComplete = filteredEntries[highlightedIndex].Description.substring(userInput.length);
        }
        ghostText.innerHTML = '<span style="color: white;">' + userInput + '</span>' + autoComplete;
    }

    function startEntrySearchBar() {
        if (searchBar.value) {
            startEntry(searchBar.value);
        }
    }

    function startEntry(value) {
        searchBar.value = '';
        pageFirst();

        const url = "/api/start";
        var data = { "Description": value };
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(data => {
                currentEntry = data; // assuming 'data' contains the started entry
                displayCurrentEntry();
                if (currentEntryInterval) {
                    clearInterval(currentEntryInterval);
                }
                currentEntryInterval = setInterval(displayCurrentEntry, 1000);
                fetchPreviousEntries(); // Refresh the entries list
            })
            .catch(error => console.error('Error:', error));
    }

    searchBar.addEventListener('input', function() {
        const searchTerm = searchBar.value;
        filteredEntries = fuzzySearch(searchTerm,entries);
        if(searchTerm === ""){
            filteredEntries = entries;
        }
        displayEntries(filteredEntries);
    });

    document.addEventListener('keydown', function(e) {
        searchBar.focus();
        if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
            e.preventDefault();
            updateHighlight(e.key === 'ArrowUp' ? 'up' : 'down');
        } else if (e.key === 'Tab' && highlightedIndex >= 0) {
            e.preventDefault();
            if (filteredEntries[highlightedIndex]) {
                const userInput = searchBar.value;
                const fullSuggestion = filteredEntries[highlightedIndex].Description;
                // Update the search bar with the full suggestion
                searchBar.value = fullSuggestion;
                const event = new Event('input', { bubbles: true });
                searchBar.dispatchEvent(event);
            }
        } else if (e.key === 'Enter') {
            startEntrySearchBar()
        }
        ghostTextUpdate();
    });

    function hoverHighlight(index) {
        if (index >= numEntries)
            index = numEntries;

        if (entryList.childNodes[highlightedIndex]) {
            entryList.childNodes[highlightedIndex].classList.remove('highlighted');
        }
        highlightedIndex = index;
        entryList.childNodes[highlightedIndex].classList.add('highlighted');
        ghostTextUpdate();
    }

    function pageFirst() {
        page = 0;
        document.getElementById('pageNumber').textContent = page + 1;
        displayEntries(entries);
    }

    function pageBack() {
        page--;

        if (page < 0)
            page = 0;

        document.getElementById('pageNumber').textContent = page + 1;

        displayEntries(entries);
    }

    function pageForward() {
        page++

        if (page > Math.floor((entries.length) / numEntries))
            page = Math.floor((entries.length) / numEntries);

        document.getElementById('pageNumber').textContent = page + 1;

        displayEntries(entries);
    }

    function pageLast() {
        page = Math.floor(entries.length / numEntries);
        document.getElementById('pageNumber').textContent = page + 1;
        displayEntries(entries);
    }

    document.getElementById('start-button').addEventListener('click', startEntrySearchBar);
    document.getElementById('login-button').addEventListener('click', function () {
        window.location.href = "/login";
    });

    document.getElementById('end-button').addEventListener('click', function() {
        fetch('/api/end', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                fetchPreviousEntries(); // Optionally refresh the list here as well
            })
            .catch(error => console.error('Error:', error));
    });
    document.getElementById('<<').addEventListener('click', pageFirst);
    document.getElementById('<').addEventListener('click', pageBack);
    document.getElementById('>').addEventListener('click', pageForward);
    document.getElementById('>>').addEventListener('click', pageLast);

    searchBar.focus();
    fetchPreviousEntries();
});
