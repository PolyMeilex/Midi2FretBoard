WebMidi.enable(function(err) {
  console.log(WebMidi.inputs);
  console.log(WebMidi.outputs);

  draw(WebMidi.inputs);
});

const app = document.getElementById("app");
const inputSelect = document.getElementById("inputSelect");
const inputBtn = document.getElementById("inputBtn");

const canvas = document.getElementById("mainCanvas");
const ctx = canvas.getContext("2d");

let fretNoteMap = generateFretNoteMap();

function draw(inputs) {
  const options = inputs.map(i => `<option value="${i.id}">${i.name}</option>`);

  inputSelect.innerHTML = options.join("\n");
}

inputBtn.addEventListener("click", function() {
  const id = inputSelect.value;
  if (id != "") {
    const input = WebMidi.getInputById(id);
    input.removeListener();
    input.addListener("noteoff", "all", function(e) {
      const pitch = e.note.number % 12;
      const oct = e.note.octave;
      let notes = findNoteInFretMap(pitch, oct);

      notes.forEach(n => {
        n.active = false;
      });
    });
    input.addListener("noteon", "all", function(e) {
      const pitch = e.note.number % 12;
      const oct = e.note.octave;
      let notes = findNoteInFretMap(pitch, oct);

      notes.forEach(n => {
        n.active = true;
      });
    });
  }
});

function findNoteInFretMap(pitch, oct) {
  let out = [];
  for (let row = 0; row < fretNoteMap.length; row++) {
    // 22 Frets + Open String = 23
    for (let n = 0; n < fretNoteMap[row].length; n++) {
      if (
        fretNoteMap[row][n].pitch == pitch &&
        fretNoteMap[row][n].oct == oct
      ) {
        out.push(fretNoteMap[row][n]);
      }
    }
  }
  return out;
}

function generateFretNoteMap() {
  const stringStartOct = [4, 3, 3, 3, 2, 2];
  const stringsStartNoteArray = [4, 11, 7, 2, 9, 4];

  let noteMap = [];

  // 6 Strings
  for (let row = 0; row < 6; row++) {
    noteMap[row] = [];
    let startOct = stringStartOct[row];
    // 22 Frets + Open String = 23
    for (let n = 0; n < 23; n++) {
      const pitch = (stringsStartNoteArray[row] + n) % 12;
      if (pitch == 0) {
        startOct++;
      }
      const oct = startOct;

      noteMap[row][n] = { pitch, oct, active: false };
    }
  }

  return noteMap;
}

function mainLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  fretNoteMap.forEach((s, i) => {
    s.forEach((n, ni) => {
      if (!n.active) return;
      ctx.fillStyle = `hsl(${n.oct * 100},100%,50%,0.5)`;
      //   ctx.fillRect(, , 30, 30);

      ctx.beginPath();
      ctx.arc(28 + ni * 46.5, 32 + i * 36, 15, 0, 2 * Math.PI);
      ctx.fill();
    });
  });
  window.requestAnimationFrame(mainLoop);
}

window.requestAnimationFrame(mainLoop);
