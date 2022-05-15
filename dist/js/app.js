"use strict";
var fretboardMap = (function generateFretBoardMap() {
    var stringStartOct = [4, 3, 3, 3, 2, 2];
    var stringsStartNote = [4, 11, 7, 2, 9, 4];
    var noteMap = [];
    // 6 Strings
    for (var row = 0; row < 6; row++) {
        noteMap[row] = [];
        var startOct = stringStartOct[row];
        // 22 Frets + Open String = 23
        for (var n = 0; n < 23; n++) {
            var pitch = (stringsStartNote[row] + n) % 12;
            if (pitch === 0) {
                startOct++;
            }
            var oct = startOct;
            noteMap[row][n] = { pitch: pitch, oct: oct };
        }
    }
    return noteMap;
})();
var noteLabels = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
var FretCell = /** @class */ (function () {
    function FretCell(x, y) {
        this.root = document.createElement("div");
        this.root.className = "cell";
        var mapEntry = fretboardMap[y][x];
        this.root.innerText = noteLabels[mapEntry.pitch];
        this.pitch = mapEntry.pitch;
        this.oct = mapEntry.oct;
    }
    FretCell.prototype.setState = function (state) {
        if (state) {
            var color = "hsl(".concat(this.oct * 100, ",100%,50%,1.0)");
            this.root.style.boxShadow = "0px 0px 20px 2px ".concat(color);
            this.root.style.backgroundColor = "".concat(color);
            this.root.style.zIndex = "999";
            // this.root.style.color = "white";
            this.root.style.fontWeight = "bold";
        }
        else {
            this.root.style.boxShadow = "";
            this.root.style.backgroundColor = "";
            this.root.style.zIndex = "";
            this.root.style.color = "";
            this.root.style.fontWeight = "";
        }
    };
    return FretCell;
}());
var FretDOM = /** @class */ (function () {
    function FretDOM() {
        this.strings = [];
        var wrapper = document.getElementById("fretboard-wrapper");
        this.root = document.createElement("div");
        this.root.id = "fretboard";
        // Strings
        for (var y = 0; y < 6; y++) {
            var row = document.createElement("div");
            row.className = "string";
            var string = [];
            for (var x = 0; x < 23; x++) {
                var cell = new FretCell(x, y);
                row.appendChild(cell.root);
                string.push(cell);
            }
            this.strings.push(string);
            this.root.appendChild(row);
        }
        // Labels
        {
            var row = document.createElement("div");
            row.className = "string";
            var cells = [];
            for (var x = 0; x < 23; x++) {
                var cell = document.createElement("div");
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
    return FretDOM;
}());
var ControlsDOM = /** @class */ (function () {
    function ControlsDOM() {
        this.deviceSelect = document.getElementById("device-select");
        this.setBtn = document.getElementById("device-set");
        this.themeBtn = document.getElementById("theme-icon");
        this.errorLabel = document.getElementById("error");
    }
    ControlsDOM.prototype.deviceSelected = function (input) { };
    ControlsDOM.prototype.connectListeners = function () {
        var _this = this;
        if (WebMidi.enabled) {
            WebMidi.addListener("connected", function () { return _this.updateInputs(); });
            WebMidi.addListener("disconnected", function () { return _this.updateInputs(); });
            // Device Select
            this.setBtn.addEventListener("click", function () {
                var id = _this.deviceSelect.value;
                var input = WebMidi.getInputById(id);
                if (input != false) {
                    _this.deviceSelected(input);
                }
            });
        }
        // Theme Select
        var link = document.getElementById("theme");
        document.getElementById("theme-icon").addEventListener("click", function () {
            if (link.getAttribute("href") === "./css/style-dark.css") {
                link.href = "./css/style-white.css";
            }
            else {
                link.href = "./css/style-dark.css";
            }
        });
        // Keyboard Toggle
        var keyboard = document.getElementById("keyboard-wrapper");
        document.getElementById("keyboard-icon").addEventListener("click", function () {
            if (keyboard.style.transform === "translateY(100%)") {
                keyboard.style.transform = "translateY(0%)";
            }
            else {
                keyboard.style.transform = "translateY(100%)";
            }
        });
    };
    ControlsDOM.prototype.updateInputs = function () {
        var inputs = WebMidi.inputs;
        var options = inputs.map(function (i) { return "<option value=\"".concat(i.id, "\">").concat(i.name, "</option>"); });
        this.deviceSelect.innerHTML = options.join("\n");
    };
    ControlsDOM.prototype.updateErrorLabel = function (err) {
        this.errorLabel.innerText = err.toString();
    };
    return ControlsDOM;
}());
var PianoKey = /** @class */ (function () {
    function PianoKey(elem, pitch) {
        this.elem = elem;
        this.isPressed = false;
        this.pitch = pitch;
    }
    PianoKey.prototype.onNote = function (pitch, oct, state) { };
    PianoKey.prototype.mousedonw = function () {
        this.elem.classList.add("key--active");
        this.isPressed = true;
        this.onNote(this.pitch, 3, true);
        this.onNote(this.pitch, 4, true);
        this.onNote(this.pitch, 5, true);
        this.onNote(this.pitch, 6, true);
    };
    PianoKey.prototype.mouseup = function () {
        this.elem.classList.remove("key--active");
        this.isPressed = false;
        this.onNote(this.pitch, 3, false);
        this.onNote(this.pitch, 4, false);
        this.onNote(this.pitch, 5, false);
        this.onNote(this.pitch, 6, false);
    };
    PianoKey.prototype.connectListeners = function () {
        var _this = this;
        this.elem.addEventListener("mousedown", function () { return _this.mousedonw(); });
        this.elem.addEventListener("mouseup", function () { return _this.mouseup(); });
        this.elem.addEventListener("mouseleave", function () {
            if (_this.isPressed) {
                _this.mouseup();
            }
        });
    };
    return PianoKey;
}());
var Main = /** @class */ (function () {
    function Main() {
        this.fretDOM = new FretDOM();
        this.controlsDOM = new ControlsDOM();
    }
    Main.prototype.onNote = function (pitch, oct, state) {
        this.fretDOM.strings.forEach(function (string) {
            string.forEach(function (cell) {
                if (cell.pitch === pitch && cell.oct == oct) {
                    cell.setState(state);
                }
            });
        });
    };
    Main.prototype.deviceSelected = function (input) {
        var _this = this;
        input.removeListener();
        input.addListener("noteoff", "all", function (e) {
            var pitch = e.note.number % 12;
            var oct = e.note.octave;
            _this.onNote(pitch, oct, false);
        });
        input.addListener("noteon", "all", function (e) {
            var pitch = e.note.number % 12;
            var oct = e.note.octave;
            var on = e.velocity != 0;
            _this.onNote(pitch, oct, on);
        });
    };
    Main.prototype.connectListeners = function () {
        var _this = this;
        this.controlsDOM.connectListeners();
        this.controlsDOM.deviceSelected = function (input) { return _this.deviceSelected(input); };
        // Keyboard
        {
            var white_1 = [];
            {
                var elems = document.querySelectorAll(".key.key--white");
                elems.forEach(function (elem) {
                    var pitch = parseInt(elem.getAttribute("pitch"));
                    var pk = new PianoKey(elem, pitch);
                    pk.onNote = function (pitch, oct, state) { return _this.onNote(pitch, oct, state); };
                    pk.connectListeners();
                    white_1.push(pk);
                });
            }
            var black_1 = [];
            {
                var elems = document.querySelectorAll(".key.key--black");
                elems.forEach(function (elem) {
                    var pitch = parseInt(elem.getAttribute("pitch"));
                    var pk = new PianoKey(elem, pitch);
                    pk.onNote = function (pitch, oct, state) { return _this.onNote(pitch, oct, state); };
                    pk.connectListeners();
                    black_1.push(pk);
                });
            }
            var keys = [
                // 
                white_1[0], black_1[1],
                white_1[1], black_1[2],
                white_1[2],
                white_1[3], black_1[3],
                white_1[4], black_1[4],
                white_1[5], black_1[5],
                white_1[6],
                // 
            ];
        }
    };
    return Main;
}());
var app = new Main();
WebMidi.enable(function (err) {
    if (!err) {
        app.connectListeners();
    }
    else {
        console.error(err);
        app.controlsDOM.updateErrorLabel(err);
        app.connectListeners();
    }
});
