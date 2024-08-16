document.addEventListener('DOMContentLoaded', function() {
    console.log("Add handler...");
        var searchBar = document.getElementById('search-bar');
        var entryList = document.getElementById('task-list');
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
    function levenshteinDistance(a, b) {
        const matrix = [];

        // Initialize the matrix
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        // Populate the rest of the matrix
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
                }
            }
        }

        return matrix[b.length][a.length];
    }

    function processDateString(data) {
        console.log(data);
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
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const sec = seconds % 60;
        return `${hours}:${minutes.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }
    function fetchPreviousEntries() {
        fetch('/api/entries') // Replace with your actual API endpoint
            .then(response => response.json())
            .then(data => {
                entries = data;
                displayEntries(entries);
                currentEntry = entries[0];
                if (currentEntry) {
                    if (currentEntryInterval) {
                        clearInterval(currentEntryInterval);
                    }
                    currentEntryInterval = setInterval(displayCurrentEntry, 1000);
                    displayCurrentEntry(); // Display current entry on page load
                }
                // add all entreis to tasks, that do not already have a Description that is in tasks
                entries.forEach(entry => {
                    if (!tasks.find(task => task.Description === entry.Description)) {
                        tasks.push(entry);
                    }
                });

                tasks.forEach(task => {
                    // for all divs in common-tasks check if there is already a div with the same textContent
                    var valid = true;
                    var count = 0;
                    commonTasksContainer.childNodes.forEach(div => {
                        count++;
                        if (div.textContent === task.Description){
                            valid = false;
                        }
                    });                    
                    if(valid || count === 0){
                        var taskDiv = document.createElement('div');
                        taskDiv.classList.add('task-box');
                        taskDiv.textContent = task.Description;
                        // on tap on the div start the task
                        taskDiv.addEventListener('click', function() {
                            startEntry(task.Description);
                        });
                        commonTasksContainer.appendChild(taskDiv);
                    }

                });
            })
            .catch(error => console.error('Error:', error));
    }

    function displayEntries(entries, highlight = false) {
        entryList.innerHTML = '';
        entries.forEach((entry, index) => {
            const li = document.createElement('li');
            li.textContent = entry.Description + " " + processDateString(entry) + " " + formatDuration(entry.Duration/1000000000);
            console.log(li);
            console.log(entry);
            li.dataset.index = index;
            entryList.appendChild(li);
        });
        if (highlight && entries.length > 0) {
            highlightEntry(0);
        }
    }

    function highlightEntry(index) {
        if (highlightedIndex >= 0 && entryList.childNodes[highlightedIndex]) {
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
        ghostText.textContent = '_'.repeat(userInput.length) +filteredEntries[highlightedIndex].Description.substring(userInput.length);
    
    }

    function startEntrySearchBar() {
        if (searchBar.value) {
            startEntry(searchBar.value);
        }
    }

    function startEntry(value) {
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
        displayEntries(filteredEntries, true);
        ghostTextUpdate();
        
    });

    searchBar.addEventListener('keydown', function(e) {
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

    document.getElementById('start-button').addEventListener('click', startEntrySearchBar);

    document.getElementById('end-button').addEventListener('click', function() {
        fetch('/api/end', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                fetchPreviousEntries(); // Optionally refresh the list here as well
            })
            .catch(error => console.error('Error:', error));
    });

    searchBar.focus();
    fetchPreviousEntries();
});
