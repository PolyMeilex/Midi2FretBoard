const fretboardMap = (function generateFretBoardMap() {
    const stringStartOct = [4, 3, 3, 3, 2, 2];
    const stringsStartNote = [4, 11, 7, 2, 9, 4];

    let noteMap: { pitch: number, oct: number }[][] = [];

    // 6 Strings
    for (let row = 0; row < 6; row++) {
        noteMap[row] = [];
        let startOct = stringStartOct[row];
        // 22 Frets + Open String = 23
        for (let n = 0; n < 23; n++) {
            const pitch = (stringsStartNote[row] + n) % 12;
            if (pitch === 0) {
                startOct++;
            }
            const oct = startOct;

            noteMap[row][n] = { pitch, oct };
        }
    }

    return noteMap;
})();

const noteLabels = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

class FretCell {
    root: HTMLElement;
    pitch: number;
    oct: number;

    constructor(x: number, y: number) {
        this.root = document.createElement("div");
        this.root.className = "cell";

        const mapEntry = fretboardMap[y][x];

        this.root.innerText = noteLabels[mapEntry.pitch];
        this.pitch = mapEntry.pitch;
        this.oct = mapEntry.oct;
    }

    setState(state: boolean) {
        if (state) {
            const color = `hsl(${this.oct * 100},100%,50%,1.0)`;
            this.root.style.boxShadow = `0px 0px 20px 2px ${color}`;
            this.root.style.backgroundColor = `${color}`;
            this.root.style.zIndex = "999";
            // this.root.style.color = "white";
            this.root.style.fontWeight = "bold"
        }
        else {
            this.root.style.boxShadow = "";
            this.root.style.backgroundColor = "";
            this.root.style.zIndex = "";
            this.root.style.color = "";
            this.root.style.fontWeight = ""
        }
    }
}

class FretDOM {
    root: HTMLElement;
    strings: FretCell[][] = [];


    constructor() {
        const wrapper = document.getElementById("fretboard-wrapper") as HTMLElement;
        this.root = document.createElement("div");
        this.root.id = "fretboard";

        // Strings
        for (let y = 0; y < 6; y++) {
            const row = document.createElement("div");
            row.className = "string";

            let string: FretCell[] = [];
            for (let x = 0; x < 23; x++) {
                const cell = new FretCell(x, y);

                row.appendChild(cell.root);

                string.push(cell);
            }
            this.strings.push(string);

            this.root.appendChild(row);
        }

        // Labels
        {
            const row = document.createElement("div");
            row.className = "string";

            const cells: HTMLElement[] = [];

            for (let x = 0; x < 23; x++) {
                const cell = document.createElement("div");
                cell.className = "cell";
                cell.style.backgroundColor = "transparent";

                cells.push(cell);

                row.appendChild(cell);
            }

            cells[3].innerText = "3fr";
            cells[5].innerText = "5fr";
            cells[7].innerText = "7fr";
            cells[9].innerText = "9fr";
            cells[12].innerText = "12fr";
            cells[15].innerText = "15fr";
            cells[17].innerText = "17fr";
            cells[19].innerText = "19fr";
            cells[21].innerText = "21fr";
            this.root.appendChild(row);
        }

        wrapper.appendChild(this.root);
    }
}

class ControlsDOM {
    deviceSelect: HTMLSelectElement;
    setBtn: HTMLButtonElement;
    themeBtn: HTMLButtonElement;
    errorLabel: HTMLElement;

    constructor() {
        this.deviceSelect = document.getElementById("device-select") as HTMLSelectElement;
        this.setBtn = document.getElementById("device-set") as HTMLButtonElement;
        this.themeBtn = document.getElementById("theme-icon") as HTMLButtonElement;
        this.errorLabel = document.getElementById("error") as HTMLElement;
    }

    deviceSelected(input: Input) { }

    connectListeners() {
        if (WebMidi.enabled) {
            WebMidi.addListener("connected", () => this.updateInputs());
            WebMidi.addListener("disconnected", () => this.updateInputs());

            // Device Select
            this.setBtn.addEventListener("click", () => {
                const id = this.deviceSelect.value;
                const input = WebMidi.getInputById(id);
                if (input != false) {
                    this.deviceSelected(input);
                }
            });
        }

        // Theme Select
        const link = document.getElementById("theme") as HTMLLinkElement;
        document.getElementById("theme-icon")!.addEventListener("click", () => {
            if (link.getAttribute("href") === "./css/style-dark.css") {
                link.href = "./css/style-white.css";
            }
            else {
                link.href = "./css/style-dark.css";
            }
        })

        // Keyboard Toggle
        const keyboard = document.getElementById("keyboard-wrapper") as HTMLLinkElement;
        document.getElementById("keyboard-icon")!.addEventListener("click", () => {
            if (keyboard.style.transform === "translateY(100%)") {
                keyboard.style.transform = "translateY(0%)";
            }
            else {
                keyboard.style.transform = "translateY(100%)";
            }
        })
    }

    updateInputs() {
        const inputs = WebMidi.inputs;

        const options = inputs.map(i => `<option value="${i.id}">${i.name}</option>`);
        this.deviceSelect.innerHTML = options.join("\n");
    }

    updateErrorLabel(err: Error) {
        this.errorLabel.innerText = err.toString();
    }
}

class PianoKey {
    elem: HTMLElement;
    isPressed: boolean;
    pitch: number;

    constructor(elem: HTMLElement, pitch: number) {
        this.elem = elem;
        this.isPressed = false;
        this.pitch = pitch;
    }

    onNote(pitch: number, oct: number, state: boolean) { }

    mousedonw() {
        this.elem.classList.add("key--active");
        this.isPressed = true;

        this.onNote(this.pitch, 3, true);
        this.onNote(this.pitch, 4, true);
        this.onNote(this.pitch, 5, true);
        this.onNote(this.pitch, 6, true);
    }

    mouseup() {
        this.elem.classList.remove("key--active");
        this.isPressed = false;

        this.onNote(this.pitch, 3, false);
        this.onNote(this.pitch, 4, false);
        this.onNote(this.pitch, 5, false);
        this.onNote(this.pitch, 6, false);
    }

    connectListeners() {
        this.elem.addEventListener("mousedown", () => this.mousedonw());
        this.elem.addEventListener("mouseup", () => this.mouseup());
        this.elem.addEventListener("mouseleave", () => {
            if (this.isPressed) {
                this.mouseup()
            }
        });
    }

}

class Main {
    fretDOM: FretDOM;
    controlsDOM: ControlsDOM;

    constructor() {
        this.fretDOM = new FretDOM();
        this.controlsDOM = new ControlsDOM();
    }

    onNote(pitch: number, oct: number, state: boolean) {
        this.fretDOM.strings.forEach((string) => {
            string.forEach((cell) => {
                if (cell.pitch === pitch && cell.oct == oct) {
                    cell.setState(state);
                }
            })
        })
    }

    deviceSelected(input: Input) {
        input.removeListener();
        input.addListener("noteoff", "all", (e) => {
            const pitch = e.note.number % 12;
            const oct = e.note.octave;
            this.onNote(pitch, oct, false);
        });
        input.addListener("noteon", "all", (e) => {
            const pitch = e.note.number % 12;
            const oct = e.note.octave;
            
            const on = e.velocity != 0;
            this.onNote(pitch, oct, on);
        });
    }

    connectListeners() {
        this.controlsDOM.connectListeners();
        this.controlsDOM.deviceSelected = (input) => this.deviceSelected(input);

        // Keyboard
        {
            const white: PianoKey[] = [];
            {
                const elems = document.querySelectorAll(".key.key--white");
                elems.forEach(elem => {
                    const pitch = parseInt(elem.getAttribute("pitch") as string);
                    const pk = new PianoKey(elem as HTMLElement, pitch);

                    pk.onNote = (pitch, oct, state) => this.onNote(pitch, oct, state);
                    pk.connectListeners();

                    white.push(pk);

                });
            }

            const black: PianoKey[] = [];
            {
                const elems = document.querySelectorAll(".key.key--black");
                elems.forEach(elem => {
                    const pitch = parseInt(elem.getAttribute("pitch") as string);
                    const pk = new PianoKey(elem as HTMLElement, pitch);

                    pk.onNote = (pitch, oct, state) => this.onNote(pitch, oct, state);
                    pk.connectListeners();

                    black.push(pk);
                });
            }

            const keys = [
                // 
                white[0], black[1],
                white[1], black[2],
                white[2],
                white[3], black[3],
                white[4], black[4],
                white[5], black[5],
                white[6],
                // 
            ];
        }
    }

}

const app = new Main();

WebMidi.enable(err => {
    if (!err) {
        app.connectListeners();
    }
    else {
        console.error(err);
        app.controlsDOM.updateErrorLabel(err);

        app.connectListeners();
    }
});

