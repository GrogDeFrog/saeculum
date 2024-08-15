let musicPlaying = false;
let intervalID;

function getRandomPentatonicNote() {
    const pentatonicNotes = ['C', 'D', 'E', 'G', 'A'];
    return pentatonicNotes[Math.floor(Math.random() * pentatonicNotes.length)];
}

function playRandomPentatonicNote() {
    intervalID = setInterval(() => {
        const note = getRandomPentatonicNote();
        playTone(note);
    }, 500);
}

/* Manage the button */
function toggleMusic() {
    const button = document.getElementById("musicButton");

    if (!musicPlaying) {
        playRandomPentatonicNote();

        button.innerHTML = "Stop Music :(";
        musicPlaying = true;
    } else {
        clearInterval(intervalID);

        button.innerHTML = "Start Music!";
        musicPlaying = false;
    }
}
