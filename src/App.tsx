import { useEffect, useMemo, useRef, useState } from "react";
import { Chip8, Chip8Options } from "./chip-8";
//import test from "./test_opcode.ch8";
import ibm from "./ibm.ch8";
// import { useQuery } from "@tanstack/react-query";
const DEBUG = import.meta.env.DEV;

const keyBindings = [
  "1",
  "2",
  "3",
  "4",
  "q",
  "w",
  "e",
  "r",
  "a",
  "s",
  "d",
  "f",
  "z",
  "x",
  "c",
  "v",
] as const;

const keys = new Array(16).fill(false);
const chip8options: Chip8Options = {};
const chip8 = new Chip8(keys, chip8options);
const recentInstructions = new Array<string>(10).fill((0x0).toString(16));

function App() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const romUrlInput = useRef<HTMLInputElement>(null);
  const filePicker = useRef<HTMLInputElement>(null);
  const onColorInput = useRef<HTMLInputElement>(null);
  const offColorInput = useRef<HTMLInputElement>(null);
  const currentIntructionDiv = useRef<HTMLDivElement>(null);
  const [rom, setRom] = useState<ArrayBuffer>();
  const [romUrl, setRomUrl] = useState(ibm);
  const [isPaused, setIsPaused] = useState(chip8.isPaused());
  const [showRecentInstructions, setShowRecentInstructions] = useState(true);
  const instructionStream = useRef<WritableStreamDefaultWriter<number>>();

  useEffect(() => {
    if (DEBUG) console.log(currentIntructionDiv.current);
    if (currentIntructionDiv.current) {
      instructionStream.current = new WritableStream<number>({
        start() {
          if (DEBUG) console.log("Stream started");
        },
        write(chunk: number) {
          if (currentIntructionDiv.current) {
            //recentInstructions.splice(0);
            const instruction = chunk.toString(16);
            if (recentInstructions[9] !== instruction) {
              recentInstructions.shift();
              recentInstructions.push(chunk.toString(16));
              currentIntructionDiv.current.innerHTML =
                recentInstructions.join("<br>");
            }
          }
          // Handle the chunk. For example, write it to the DOM or send it over the network.
        },
        close() {
          if (DEBUG) console.log("Stream closed");
        },
        abort(reason: any) {
          if (DEBUG) console.error(`Stream aborted due to: ${reason}`);
        },
      }).getWriter();
    }
  }, [currentIntructionDiv.current]);

  // useEffect(() => {
  //   setRom(data);
  // }, [data]);
  useEffect(() => {
    const keydown = (ev: KeyboardEvent) => {
      const index = keyBindings.findIndex((v) => v === ev.key.toLowerCase());
      if (index !== -1) {
        keys[index] = true;
        if (DEBUG) console.log("pressed " + index);
      }
    };
    const keyup = (ev: KeyboardEvent) => {
      const index = keyBindings.findIndex((v) => v === ev.key.toLowerCase());
      if (index !== -1) {
        keys[index] = false;
        if (DEBUG) console.log("released " + index);
      }
    };
    document.addEventListener("keydown", keydown);
    document.addEventListener("keyup", keyup);

    return () => {
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("keyup", keyup);
    };
  }, []);

  useEffect(() => {
    if (DEBUG) console.log(instructionStream.current);
    chip8options.currentInstructionWriter = instructionStream.current;
  }, [instructionStream.current]);
  useEffect(() => {
    if (filePicker.current) {
      const listener = () => {
        const file = filePicker.current?.files?.[0]; // Get the first (and only) file
        if (file) {
          const reader = new FileReader();
          reader.onload = function (loadEvent) {
            const arrayBuffer = loadEvent?.target?.result;
            setRom(arrayBuffer as ArrayBuffer);
          };
          reader.onerror = function () {
            console.error("There was an error reading the file:", reader.error);
          };
          reader.readAsArrayBuffer(file); // Read the file as an ArrayBuffer
        }
      };
      filePicker.current.addEventListener("change", listener);
      return () => filePicker.current?.removeEventListener("change", listener);
    }
  }, [filePicker.current]);

  useEffect(() => {
    fetch(romUrl)
      .then((r) => r.arrayBuffer())
      .then((buf) => setRom(buf));
  }, [romUrl]);
  useEffect(() => {
    if (rom) {
      chip8.loadRom(rom);
      if (DEBUG) console.log("ROM loaded");
      chip8.start();
      return () => {
        chip8.stop();
        setIsPaused(chip8.isPaused());
      };
    }
  }, [rom]);
  const ctx = useMemo(() => canvas.current?.getContext("2d"), [canvas.current]);

  useEffect(() => {
    if (ctx) {
      const lastFramePixels = new Array<boolean>(64 * 32).fill(true);
      const display = chip8.getDisplay();
      const render = () => {
        for (let y = 0; y < 32; y++) {
          for (let x = 0; x < 64; x++) {
            if (lastFramePixels[x + y * 64] !== display[x + y * 64]) {
              ctx.fillStyle = display[x + y * 64]
                ? onColorInput.current?.value === ""
                  ? "green"
                  : onColorInput.current!.value
                : offColorInput.current?.value === ""
                ? "black"
                : offColorInput.current!.value;
              ctx.fillRect(x * 10, y * 10, 1 * 10, 1 * 10);
              lastFramePixels[x + y * 64] = display[x + y * 64];
            }
          }
        }
        requestAnimationFrame(render);
      };

      render();
    }
  }, [ctx]);

  return (
    <>
      <label>URL to ROM: </label>
      <input ref={romUrlInput}></input>
      <button onClick={() => setRomUrl(romUrlInput.current?.value ?? ibm)}>
        Load ROM
      </button>
      <br />
      <label>Upload ch8: </label>
      <input type="file" ref={filePicker} accept=".ch8" />
      {/* <button onClick={() => chip8.start()}>Start</button> */}
      {/* <button onClick={() => chip8.stop()}>Abort</button> */}
      <canvas ref={canvas} width={640} height={320}></canvas>
      <br />
      <label>On-Color: </label>
      <input ref={onColorInput}></input>
      <label>Off-Color: </label>
      <input ref={offColorInput}></input>
      <button
        onClick={() => {
          chip8.togglePause();
          setIsPaused(chip8.isPaused());
        }}
      >
        {isPaused ? "Unpause" : "Pause"}
      </button>
      <br />
      <button onClick={() => setShowRecentInstructions((s) => !s)}>
        {showRecentInstructions ? "Hide instructions" : "Show instructions"}
      </button>
      Recent Intructions:{" "}
      {showRecentInstructions && <div ref={currentIntructionDiv}></div>}
    </>
  );
}

export default App;
