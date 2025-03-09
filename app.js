const whiteKeyWidth = 70;
const pianoHeight = 400;
const canvasHeight = window.innerHeight - pianoHeight;

const naturalNotes = ["C", "D", "E", "F", "G", "A", "B"];
const naturalNotesSharps = ["C", "D", "F", "G", "A"];
const naturalNotesFlats = ["D", "E", "G", "A", "B"];

const range = ["C2", "C7"];
let isMouseDown = false;
let fallingNotes = [];
let animationFrame;
let pianoWidth;
let allNaturalNotes = [];
let keyPositions = {};
let currentTime = 0;
let lastFrameTime = 0;
let flameParticles = [];

const pi = new Tone.Sampler(filename, {
    curve: "exponential",
    attack: 0,
    release: 4,
    sustain: 1,
    decay: 1
});

const vol = new Tone.Volume(10);

const app = {
    init() {
        document.body.style.height = "100vh";
        document.body.style.margin = "0";
        document.body.style.overflow = "hidden";
        document.body.style.display = "flex";
        document.body.style.flexDirection = "column";

        this.createNotesCanvas();
        this.setupPiano();
        this.createFlameCanvas();
        this.startFlameAnimation();

        document.addEventListener('mouseup', () => {
            isMouseDown = false;
        });

        // Eğer otomatik çalınacaksa burası açılacak
        // this.startNoteAnimation();
    },

    createNotesCanvas() {
        const notesCanvas = document.createElement('div');
        notesCanvas.id = "notes-container";
        notesCanvas.style.height = canvasHeight + "px";
        notesCanvas.style.position = "relative";
        notesCanvas.style.overflow = "hidden";
        notesCanvas.style.background = "#222";

        document.body.insertBefore(notesCanvas, document.getElementById('piano'));
    },

    createFlameCanvas() {
        const flameCanvas = document.createElement('canvas');
        flameCanvas.id = "flame-canvas";
        flameCanvas.width = window.innerWidth;
        flameCanvas.height = 150;
        flameCanvas.style.position = "absolute";
        flameCanvas.style.bottom = "0";
        flameCanvas.style.left = "0";
        flameCanvas.style.zIndex = "50";
        flameCanvas.style.pointerEvents = "none";
        
        document.getElementById('notes-container').appendChild(flameCanvas);
    },

    startFlameAnimation() {
        const canvas = document.getElementById('flame-canvas');
        const ctx = canvas.getContext('2d');
        
        // Create fewer initial flame particles
        const maxParticles = 50; // Significantly reduced from original
        
        // Initialize with fewer particles
        for (let i = 0; i < maxParticles; i++) {
            this.createFlameParticle(Math.random() * pianoWidth);
        }
        
        const animateFlame = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw and update flame particles
            for (let i = flameParticles.length - 1; i >= 0; i--) {
                const particle = flameParticles[i];
                
                // Simpler particle update
                particle.y -= particle.speed;
                particle.life -= 1;
                
                // Simple circle instead of gradient for better performance
                ctx.beginPath();
                ctx.fillStyle = `rgba(255, 255, 255, ${particle.life / 100})`;
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Remove dead particles
                if (particle.life <= 0) {
                    flameParticles.splice(i, 1);
                    // Create new particle at a random position
                    if (flameParticles.length < maxParticles) {
                        this.createFlameParticle(Math.random() * pianoWidth);
                    }
                }
            }
            
            // Use throttled animation frame for better performance
            setTimeout(() => {
                requestAnimationFrame(animateFlame);
            }, 1000/30); // Cap at 30fps
        };
        
        animateFlame();
    },

    createFlameParticle(x, isKeyPress = false) {
        if (isKeyPress && flameParticles.length > 100) return;
        
        const baseY = isKeyPress ? pianoHeight - 20 : 150;
        const particle = {
            x: x,
            y: baseY,
            size: isKeyPress ? 5 : 2,
            speed: 2,
            life: isKeyPress ? 50 : 40
        };
        
        flameParticles.push(particle);
        
        if (isKeyPress) {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (flameParticles.length < 150) {
                        const spreadX = x + (Math.random() * 10 - 5);
                        this.createFlameParticle(spreadX, false);
                    }
                }, i * 50);
            }
        }
    },

    createKeyPressFlame(noteName) {
        if (keyPositions[noteName]) {
            const keyPos = keyPositions[noteName];
            const x = keyPos.x + keyPos.width / 2;
            this.createFlameParticle(x, true);
        }
    },

    setupPiano() {
        const piano = document.querySelector("#piano");
        piano.style.position = "relative";
        piano.style.zIndex = "100";

        allNaturalNotes = this.getAllNaturalNotes(range);
        pianoWidth = allNaturalNotes.length * whiteKeyWidth;

        const SVG = this.createMainSVG(pianoWidth, pianoHeight);

        let whiteKeyPositionX = 0;

        allNaturalNotes.forEach((noteName) => {
            const whiteKeyTextGroup = utils.createSVGElement("g");
            const whiteKey = this.createKey({ className: "white-key", width: whiteKeyWidth, height: pianoHeight });
            const text = utils.createSVGElement("text");

            utils.addTextContent(text, noteName);
            utils.setAttributes(whiteKeyTextGroup, { "width": whiteKeyWidth });
            utils.setAttributes(text, {
                "x": whiteKeyPositionX + whiteKeyWidth / 2,
                "y": 380,
                "text-anchor": "middle"
            });
            utils.setAttributes(whiteKey, {
                "x": whiteKeyPositionX,
                "data-note-name": noteName,
                "rx": "15",
                "ry": "15"
            });

            whiteKey.addEventListener("mousedown", () => {
                isMouseDown = true;
                utils.playNote(noteName);
                this.createKeyPressFlame(noteName);
            });

            whiteKey.addEventListener("mouseover", () => {
                if (isMouseDown) {
                    utils.playNote(noteName);
                    this.createKeyPressFlame(noteName);
                }
            });

            text.classList.add("white-key-text");
            whiteKeyTextGroup.appendChild(whiteKey);
            whiteKeyTextGroup.appendChild(text);
            SVG.appendChild(whiteKeyTextGroup);

            keyPositions[noteName] = {
                x: whiteKeyPositionX,
                width: whiteKeyWidth,
                type: 'white'
            };

            whiteKeyPositionX += whiteKeyWidth;
        });

        let blackKeyPositionX = 60;
        allNaturalNotes.forEach((naturalNote, index, array) => {
            if (index === array.length - 1) {
                return;
            }

            const blackKeyTextGroup = utils.createSVGElement("g");
            const blackKey = this.createKey({ className: "black-key", width: whiteKeyWidth / 2, height: pianoHeight / 1.6 });
            const flatNameText = utils.createSVGElement("text");
            const sharpNameText = utils.createSVGElement("text");

            utils.setAttributes(blackKeyTextGroup, { "width": whiteKeyWidth / 2 });

            for (let i = 0; i < naturalNotesSharps.length; i++) {
                let naturalSharpNoteName = naturalNotesSharps[i];
                let naturalFlatNoteName = naturalNotesFlats[i];

                if (naturalSharpNoteName === naturalNote[0]) {

                    const noteSharp = `${naturalSharpNoteName}#${naturalNote[1]}`;
                    const noteFlat = `${naturalFlatNoteName}b${naturalNote[1]}`;

                    utils.setAttributes(blackKey, {
                        "x": blackKeyPositionX,
                        "data-sharp-name": noteSharp,
                        "data-flat-name": noteFlat,
                        "rx": "8",
                        "ry": "8"
                    });

                    blackKey.addEventListener("mousedown", () => {
                        isMouseDown = true;
                        utils.playNote(noteSharp);
                        this.createKeyPressFlame(noteSharp);
                    });

                    blackKey.addEventListener("mouseover", () => {
                        if (isMouseDown) {
                            utils.playNote(noteSharp);
                            this.createKeyPressFlame(noteSharp);
                        }
                    });

                    utils.setAttributes(sharpNameText, {
                        "text-anchor": "middle",
                        'y': 215,
                        "x": blackKeyPositionX + (whiteKeyWidth / 4)
                    });

                    utils.setAttributes(flatNameText, {
                        "text-anchor": "middle",
                        'y': 235,
                        "x": blackKeyPositionX + (whiteKeyWidth / 4)
                    });

                    utils.addTextContent(sharpNameText, `${naturalSharpNoteName}♯`);
                    utils.addTextContent(flatNameText, `${naturalFlatNoteName}♭`);

                    flatNameText.classList.add("black-key-text");
                    sharpNameText.classList.add("black-key-text");

                    keyPositions[noteSharp] = {
                        x: blackKeyPositionX,
                        width: whiteKeyWidth / 2,
                        type: 'black'
                    };

                    keyPositions[noteFlat] = {
                        x: blackKeyPositionX,
                        width: whiteKeyWidth / 2,
                        type: 'black'
                    };

                    if (naturalSharpNoteName === "D" || naturalSharpNoteName === "A") {
                        blackKeyPositionX += whiteKeyWidth * 2;
                    } else {
                        blackKeyPositionX += whiteKeyWidth;
                    }

                    blackKeyTextGroup.appendChild(blackKey);
                    blackKeyTextGroup.appendChild(flatNameText);
                    blackKeyTextGroup.appendChild(sharpNameText);
                }
            }
            SVG.appendChild(blackKeyTextGroup);
        });

        // Add CSS for glowing effects
        const style = document.createElement('style');
        style.textContent = `
            .white-key, .black-key {
                transition: filter 0.2s;
            }
            .white-key.show {
                fill: #fff;
                filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8));
            }
            .black-key.show {
                fill: #000;
                filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8));
            }
        `;
        document.head.appendChild(style);

        piano.appendChild(SVG);
    },

    startNoteAnimation() {
        const noteSpeed = 10;

        const animateNotes = (timestamp) => {
            if (!lastFrameTime) lastFrameTime = timestamp;
            const deltaTime = timestamp - lastFrameTime;
            lastFrameTime = timestamp;
            const timeScale = 0.5;
            currentTime += deltaTime * 1 / timeScale;

            noteSequence.forEach(note => {
                if (note.start <= currentTime && !note.added) {
                    const noteName = note.key;
                    const keyPosition = keyPositions[noteName];

                    if (keyPosition) {
                        const noteElement = document.createElement('div');
                        const noteHeight = (note.duration / 30);

                        noteElement.style.position = "absolute";
                        noteElement.style.top = "0px";
                        noteElement.style.left = `${keyPosition.x}px`;
                        noteElement.style.width = `${keyPosition.width}px`;
                        noteElement.style.height = `${noteHeight}px`;
                        noteElement.style.background = keyPosition.type === 'white' ? "#fff" : "#4b4b4b";
                        noteElement.style.borderRadius = "5px";

                        document.getElementById('notes-container').appendChild(noteElement);

                        fallingNotes.push({
                            element: noteElement,
                            top: 0,
                            noteName: noteName,
                            height: noteHeight,
                            startTime: currentTime,
                            duration: note.duration,
                            isPlaying: false
                        });

                        note.added = true;
                    }
                }
            });

            fallingNotes.forEach((note, index) => {
                note.top += noteSpeed;
                note.element.style.top = `${note.top}px`;

                const noteName = note.noteName;
                const noteBottom = note.top + note.height;

                if (!note.isPlaying && noteBottom >= canvasHeight) {
                    const noteDuration = (note.duration / 1000) + "s";
                    utils.playNote(noteName, noteDuration);
                    note.isPlaying = true;

                    // Create flame effect for auto-played notes
                    app.createKeyPressFlame(noteName);

                    const keyElement = document.querySelector(`[data-note-name="${noteName}"], [data-sharp-name="${noteName}"], [data-flat-name="${noteName}"]`);
                    if (keyElement) {
                        keyElement.classList.add("show");
                    }
                }

                if (note.top >= canvasHeight) {
                    const keyElement = document.querySelector(`[data-note-name="${noteName}"], [data-sharp-name="${noteName}"], [data-flat-name="${noteName}"]`);
                    if (keyElement && note.isPlaying) {
                        setTimeout(() => {
                            keyElement.classList.remove("show");
                        }, 300);
                    }

                    fallingNotes.splice(index, 1);
                    note.element.remove();
                }
            });

            if (currentTime > noteSequence[noteSequence.length - 1].start + 2000 && fallingNotes.length === 0) {
                currentTime = 0;
                noteSequence.forEach(note => note.added = false);
            }

            animationFrame = requestAnimationFrame(animateNotes);
        };

        animationFrame = requestAnimationFrame(animateNotes);
    },

    createOctave(octaveNumber) {
        const octave = utils.createSVGElement("g");
        octave.classList.add("octave");
        octave.setAttribute("transform", `translate(${octaveNumber * octaveWidth}, 0)`);
        return octave;
    },

    createKey({ className, width, height }) {
        const key = utils.createSVGElement("rect");
        key.classList.add(className, "key");
        utils.setAttributes(key, {
            "width": width,
            "height": height
        });
        return key;
    },

    getAllNaturalNotes([firstNote, lastNote]) {
        const firstNoteName = firstNote[0];
        const firstOctaveNumber = parseInt(firstNote[1]);

        const lastNoteName = lastNote[0];
        const lastOctaveNumber = parseInt(lastNote[1]);

        const firstNotePosition = naturalNotes.indexOf(firstNoteName);
        const lastNotePosition = naturalNotes.indexOf(lastNoteName);

        const allNaturalNotes = [];

        for (let octaveNumber = firstOctaveNumber; octaveNumber <= lastOctaveNumber; octaveNumber++) {
            if (octaveNumber === firstOctaveNumber) {
                naturalNotes.slice(firstNotePosition).forEach((noteName) => {
                    allNaturalNotes.push(noteName + octaveNumber);
                });

            } else if (octaveNumber === lastOctaveNumber) {
                naturalNotes.slice(0, lastNotePosition + 1).forEach((noteName) => {
                    allNaturalNotes.push(noteName + octaveNumber);
                });

            } else {
                naturalNotes.forEach((noteName) => {
                    allNaturalNotes.push(noteName + octaveNumber);
                });
            }
        }
        return allNaturalNotes;
    },

    createMainSVG(pianoWidth, pianoHeight) {
        const svg = utils.createSVGElement("svg");

        utils.setAttributes(svg, {
            "width": "100%",
            "version": "1.1",
            "xmlns": "http://www.w3.org/2000/svg",
            "xmlns:xlink": "http://www.w3.org/1999/xlink",
            "viewBox": `0 0 ${pianoWidth} ${pianoHeight}`
        });

        return svg;
    },

    displayNotes(notes) {
        const pianoKeys = document.querySelectorAll(".key");
        utils.removeClassFromNodeCollection(pianoKeys, "show");

        notes.forEach(noteName => {
            pianoKeys.forEach(key => {
                const naturalName = key.dataset.noteName;
                const sharpName = key.dataset.sharpName;
                const flatName = key.dataset.flatName;

                if (naturalName === noteName || sharpName === noteName || flatName === noteName) {
                    key.classList.add("show");
                    app.createKeyPressFlame(noteName);
                }
            });
        });
    }
};

const utils = {
    createSVGElement(el) {
        const element = document.createElementNS("http://www.w3.org/2000/svg", el);
        return element;
    },
    setAttributes(el, attrs) {
        for (let key in attrs) {
            el.setAttribute(key, attrs[key]);
        }
    },
    addTextContent(el, content) {
        el.textContent = content;
    },
    removeClassFromNodeCollection(nodeCollection, classToRemove) {
        nodeCollection.forEach(node => {
            if (node.classList.contains(classToRemove)) {
                node.classList.remove(classToRemove);
            }
        });
    },
    playNote(note, duration) {
        const noteNumber = Tone.Frequency(note).toMidi();
        pi.triggerAttackRelease(Tone.Frequency(noteNumber, "midi").toNote(), duration || "4n");
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
    pi.chain(vol, Tone.Master);
});