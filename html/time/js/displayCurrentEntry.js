import { formatDuration } from ./dateUtils.js;

document.addEventListener('DOMContentLoaded', function() {
    var currentTask = null;

    function displayCurrentTask() {
        console.log("Displayin' current task");
        if (currentTask) {
            description = currentTask.Description;
            startTime = new Date(currentTask.StartTime);
        } else {
            description = "Start your first task!";
            startTime = new Date();
        }

        document.getElementById('current-task-name').textContent = description;
        const elapsedTime = Math.floor((new Date() - startTime) / 1000);
        document.getElementById('current-task-duration').textContent = formatDuration(elapsedTime);
    }
});
