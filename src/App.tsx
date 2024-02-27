// import { useEffect, useMemo, useRef, useState } from "react";
// import { Chip8 } from "./chip-8";
// //import test from "./test_opcode.ch8";
// import ibm from "./ibm.ch8";

// const mockScreen = {
//   clear() {
//     console.log("clear");
//   },
//   draw(x, y, n) {
//     console.log(`draw ${x} ${y} ${n}`);
//   },
// } satisfies Chip8Screen;

//const chip8 = new Chip8();

// function App() {
//   const canvas = useRef<HTMLCanvasElement>(null);
//   const [rom, setRom] = useState<ArrayBuffer>();

//   useEffect(() => {
//     if (rom) {
//       chip8.loadRom(rom);
//       console.log("rom loaded")
//       chip8.cycle();
//     }
//   }, [rom]);
//   const ctx = useMemo(() => canvas.current?.getContext("2d"), [canvas.current]);

//   useEffect(() => {
//     if (ctx && rom) {
//       const render = () => {
//         for (let y = 0; y < 32; y++) {
//           for (let x = 0; x < 64; x++) {
//             ctx.fillStyle = chip8.getDisplay()[x + y * 64] ? "green" : "black";
//             ctx.fillRect(x, y, 1, 1);
//           }
//         }
//         console.log("In render")
//         requestAnimationFrame(render);
//       };
//       render()
//     }
//   }, [ctx, rom]);
//   //const chip8screen = useMemo<Chip8Screen>(() => {clear: () => ctx?.clearRect(0,0,canvas.current?.width ?? 0, canvas.current?.height ?? 0), dra}, [ctx])

//   // const chip8screen = useRef<Chip8Screen>({
//   //   clear: () => {
//   //     canvas.current.c;
//   //   },
//   // });

//   useEffect(() => {
//     fetch(ibm)
//       .then((r) => r.arrayBuffer())
//       .then((b) => setRom(b));
//   }, []);

//   return <canvas ref={canvas} width={500} height={500}></canvas>;
// }

//export default App;
