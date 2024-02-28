import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";



// const root = document.getElementById("root")!;

// const canvas = document.createElement("canvas");

// canvas.width = 640;
// canvas.height = 320;

// root.append(canvas);

// const chip8 = new Chip8();
// const ctx = canvas.getContext("2d")!;
// const render = () => {
//   for (let y = 0; y < 32; y++) {
//     for (let x = 0; x < 64; x++) {
//       ctx.fillStyle = chip8.getDisplay()[x + y * 64] ? "green" : "black";
//       ctx.fillRect(x * 10, y * 10, 10, 10);
//     }
//   }
//   requestAnimationFrame(render);
// };

// fetch(test)
//   .then((r) => r.arrayBuffer())
//   .then((buf) => {
//     chip8.loadRom(buf);
//     chip8.start();
//   });

// render();
//const queryClient = new QueryClient()
// await queryClient.fetchQuery({queryKey:["rom"], queryFn: async () => {
//   const r = await fetch(ibm);
//   const buf = await r.arrayBuffer()
//   return buf.slice(0, buf.byteLength)
// }})
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* <QueryClientProvider client={queryClient}> */}
      <App />
    {/* </QueryClientProvider> */}
  </React.StrictMode>
);
