import { useEffect, useMemo, useRef, useState } from "react";
import { Chip8 } from "./chip-8";
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
const chip8 = new Chip8(keys);

function App() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const romUrlInput = useRef<HTMLInputElement>(null);
  const onColorInput = useRef<HTMLInputElement>(null);
  const offColorInput = useRef<HTMLInputElement>(null);
  const [rom, setRom] = useState<ArrayBuffer>();
  const [romUrl, setRomUrl] = useState(ibm);

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
    fetch(romUrl)
      .then((r) => r.arrayBuffer())
      .then((buf) => setRom(buf));
  }, [romUrl]);
  useEffect(() => {
    if (rom) {
      chip8.loadRom(rom);
      if (DEBUG) console.log("ROM loaded");
      chip8.start();
      return () => chip8.stop();
    }
  }, [rom]);
  const ctx = useMemo(() => canvas.current?.getContext("2d"), [canvas.current]);

  useEffect(() => {
    if (ctx) {
      const render = () => {
        for (let y = 0; y < 32; y++) {
          for (let x = 0; x < 64; x++) {
            ctx.fillStyle = chip8.getDisplay()[x + y * 64]
              ? onColorInput.current?.value === "" ? "green" : onColorInput.current!.value
              : offColorInput.current?.value === "" ?  "black" : offColorInput.current!.value;
            ctx.fillRect(x * 10, y * 10, 1 * 10, 1 * 10);
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
      {/* <button onClick={() => chip8.start()}>Start</button> */}
      <button onClick={() => chip8.stop()}>Abort</button>
      <canvas ref={canvas} width={640} height={320}></canvas>
      <br />
      <label>On-Color: </label>
      <input ref={onColorInput}></input>
      <label>Off-Color: </label>
      <input ref={offColorInput}></input>
    </>
  );
}

export default App;
