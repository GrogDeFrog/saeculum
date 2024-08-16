document.addEventListener('DOMContentLoaded', function() {
    let entries = [];

    function fetchPreviousTasks() {
        fetch('/api/entries')
            .then(response => response.json())
            .then(data => {
                entries = data;
                displayTasks(entries);
                currentTask = entries[0];
                if (currentTask) {
                    if (currentTaskInterval) {
                        clearInterval(currentTaskInterval);
                    }
                    currentTaskInterval = setInterval(displayCurrentTask, 1000);
                    displayCurrentTask(); // Display current entry on page load
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
                            startTask(task.Description);
                        });
                        commonTasksContainer.appendChild(taskDiv);
                    }

                });
            })
            .catch(error => console.error('Error:', error));
    }
}
