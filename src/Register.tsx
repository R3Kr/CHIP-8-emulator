import { useEffect, useMemo, useRef, useState } from "react";
import { Chip8, Chip8Options } from "./chip-8";
import { DEBUG } from "./App";

interface Props {
  chip8: Chip8;
  chip8options: Chip8Options;
  register: number;
  isPaused: boolean;
}
export default function Register({
  chip8,
  chip8options,
  register,
  isPaused,
}: Props) {
  const [value, setValue] = useState<number>(0);
  const valueAsString = useMemo(
    () => value.toString(16).padStart(2, "0"),
    [value]
  );
  const registerStream = useRef<WritableStreamDefaultWriter<number>>();

  useEffect(() => {
    registerStream.current = new WritableStream<number>({
      start() {
        if (DEBUG) console.log("Stream started");
      },
      write(chunk: number) {
        if (registerStream.current) {
          //recentInstructions.splice(0);
        //   const registerValue = chunk.toString(16).padStart(2, "0");
        //   if (DEBUG) console.log(`Register ${register} got: ${registerValue}`);
          setValue(chunk);
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
  }, []);

  useEffect(() => {
    chip8options.registerWriters[register] = registerStream.current;
  }, [registerStream.current]);
  return (
    <>
      <div style={{ fontFamily: "monospace" }}>
        Register {register.toString().padEnd(2, " ")}:{" "}
        <div style={{ display: "inline" }}>{valueAsString}</div>
        {isPaused && (
          <input
            type="number"
            defaultValue={value}
            onChange={(e) => {
              chip8.updateRegister(register, e.target.valueAsNumber);
            }}
          ></input>
        )}
      </div>
    </>
  );
}
