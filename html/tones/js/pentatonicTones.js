function getRandomPentatonicNote() {
  const pentatonicNotes = ['C', 'D', 'E', 'G', 'A'];
  return pentatonicNotes[Math.floor(Math.random() * pentatonicNotes.length)];
}

function playRandomPentatonicNote() {
  setInterval(() => {
    const note = getRandomPentatonicNote();
    playTone(note);
  }, 500);
}
