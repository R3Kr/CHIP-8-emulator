import { useEffect, useMemo, useRef, useState } from "react";
import { Chip8 } from "./chip-8";
//import test from "./test_opcode.ch8";
import ibm from "./ibm.ch8";
// import { useQuery } from "@tanstack/react-query";

const chip8 = new Chip8();

function App() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [rom, setRom] = useState<ArrayBuffer>();
  const [romUrl, setRomUrl] = useState(ibm)

  // useEffect(() => {
  //   setRom(data);
  // }, [data]);
  useEffect(() => {
    fetch(romUrl).then(r => r.arrayBuffer()).then(buf => setRom(buf))   
  }, [romUrl])
  useEffect(() => {
    if (rom) {
      chip8.loadRom(rom);
      console.log("ROM loaded");
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
            ctx.fillStyle = chip8.getDisplay()[x + y * 64] ? "green" : "black";
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
      <input ref={input}></input>
      <button onClick={() => setRomUrl(input.current?.value ?? ibm)}>
        Load ROM
      </button>
      {/* <button onClick={() => chip8.start()}>Start</button> */}
      <button onClick={() => chip8.stop()}>Abort</button>
      <canvas ref={canvas} width={640} height={320}></canvas>
    </>
  );
}

export default App;
