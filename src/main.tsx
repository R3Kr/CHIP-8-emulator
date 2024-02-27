// import React from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App.tsx";
import "./index.css";
import { Chip8 } from "./chip-8.ts";
import ibm from "./ibm.ch8";
//import test from "./test_opcode.ch8";

const root = document.getElementById("root")!;

const canvas = document.createElement("canvas");

canvas.width = 500;
canvas.height = 500;

root.append(canvas);

const chip8 = new Chip8();
const ctx = canvas.getContext("2d")!;
const render = () => {
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 64; x++) {
      ctx.fillStyle = chip8.getDisplay()[x + y * 64] ? "green" : "black";
      ctx.fillRect(x, y, 1, 1);
    }
  }
  requestAnimationFrame(render);
};

fetch(ibm)
  .then((r) => r.arrayBuffer())
  .then((buf) => {
    chip8.loadRom(buf);
    chip8.cycle();
  });

render();

// ReactDOM.createRoot(document.getElementById('root')!).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
// )
