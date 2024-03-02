const DEBUG = import.meta.env.DEV;
const chip8FontSet = [
  0xf0,
  0x90,
  0x90,
  0x90,
  0xf0, // 0
  0x20,
  0x60,
  0x20,
  0x20,
  0x70, // 1
  0xf0,
  0x10,
  0xf0,
  0x80,
  0xf0, // 2
  0xf0,
  0x10,
  0xf0,
  0x10,
  0xf0, // 3
  0x90,
  0x90,
  0xf0,
  0x10,
  0x10, // 4
  0xf0,
  0x80,
  0xf0,
  0x10,
  0xf0, // 5
  0xf0,
  0x80,
  0xf0,
  0x90,
  0xf0, // 6
  0xf0,
  0x10,
  0x20,
  0x40,
  0x40, // 7
  0xf0,
  0x90,
  0xf0,
  0x90,
  0xf0, // 8
  0xf0,
  0x90,
  0xf0,
  0x10,
  0xf0, // 9
  0xf0,
  0x90,
  0xf0,
  0x90,
  0x90, // A
  0xe0,
  0x90,
  0xe0,
  0x90,
  0xe0, // B
  0xf0,
  0x80,
  0x80,
  0x80,
  0xf0, // C
  0xe0,
  0x90,
  0x90,
  0x90,
  0xe0, // D
  0xf0,
  0x80,
  0xf0,
  0x80,
  0xf0, // E
  0xf0,
  0x80,
  0xf0,
  0x80,
  0x80, // F
] as const;
export interface Chip8Screen {
  clear: () => void;
  draw: (
    vx: number,
    vy: number,
    n: number,
    memory: ArrayBuffer,
    toggleVF: (on: boolean) => void
  ) => void;
}

// export class CanvasChip8Screen implements Chip8Screen {
//   ctx: CanvasRenderingContext2D;
//   constructor(ctx: CanvasRenderingContext2D) {
//     this.ctx = ctx;
//   }
//   clear() {
//     this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
//   }

// }

export class Chip8 {
  memory: Uint8Array;
  V: Uint8Array;
  I: number;
  pc: number;
  stack: number[];
  delayTimer: number;
  soundTimer: number;
  display: boolean[];
  readonly keys: boolean[];
  setIntervalRef?: number;
  tickRate = 20;
  private paused = false;
  constructor(keys: boolean[]) {
    this.memory = new Uint8Array(4096);
    this.V = new Uint8Array(16); // Registers V0 to VF
    this.I = 0; // Index register
    this.pc = 0x200; // Program counter starts at 0x200
    this.stack = [];
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.display = new Array(64 * 32).fill(false); // Display initialized to off
    this.keys = keys; //new Array(16).fill(false); // Key states
    this.memory.set(chip8FontSet, 0x50);
  }

  getDisplay() {
    return this.display;
  }

  // Initialize emulator with ROM
  loadRom(rom: ArrayBuffer) {
    // Load ROM into memory starting at 0x200
    if (this.setIntervalRef) {
      this.stop();
    }
    this.memory.set(new Uint8Array(rom), 0x200);
  }

  isPaused() {
    return this.paused
  }
  togglePause() {
    if (this.paused) {
      this.start()
    }
    else {
      clearInterval(this.setIntervalRef)
      this.setIntervalRef = undefined
    }
    this.paused = !this.paused
  }

  draw(vx: number, vy: number, n: number) {
    let y = this.V[vy] & 31;
    this.V[0xf] = 0;

    for (let i = 0; i < n; i++) {
      const byte = this.memory[this.I + i];
      let x = this.V[vx] & 63;

      for (let j = 7; j >= 0; j--) {
        const bit = (byte >> j) & 1;
        const pixel = this.display[x + y * 64];
        if (bit && pixel) {
          this.display[x + y * 64] = false;
          this.V[0xf] = 1;
        }
        if (bit && !pixel) {
          this.display[x + y * 64] = true;
        }

        if (x + 1 > 63) {
          break;
        } else {
          x++;
        }
      }
      if (y + 1 > 31) {
        break;
      } else {
        y++;
      }
    }
  }

  private loop() {
    return setInterval(() => {
      if (this.delayTimer) {
        this.delayTimer--;
      }
      if (this.soundTimer) {
        this.soundTimer--;
      }
      for (let i = 0; i < this.tickRate; i++) {
        this.cycle();
      }
    }, 1000 / 60)
  }

  start() {
    this.setIntervalRef = this.loop();
  }

  stop() {
    clearInterval(this.setIntervalRef);
    this.paused = false;
    this.setIntervalRef = undefined;
    this.memory = new Uint8Array(4096);
    this.V = new Uint8Array(16); // Registers V0 to VF
    this.I = 0; // Index register
    this.pc = 0x200; // Program counter starts at 0x200
    this.stack = [];
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.display = new Array(64 * 32).fill(false); // Display initialized to off
    //this.keys = new Array(16).fill(false); // Key states
    this.memory.set(chip8FontSet, 0x50);
  }

  // Emulator cycle
  cycle() {
    // Fetch, decode, and execute instructions

    const firstNibble = this.memory[this.pc] >> 4;
    const secondNibble = this.memory[this.pc] & 0xf;
    const thirdNibble = this.memory[this.pc + 1] >> 4;
    const fourthNibble = this.memory[this.pc + 1] & 0xf;
    this.pc += 2;
    switch (firstNibble) {
      case 0:
        if (fourthNibble === 0xe) {
          const newpc = this.stack.pop();
          this.pc = newpc ? newpc : 0x200;
          if (DEBUG) 
            console.log(
              newpc
                ? "return"
                : "RUNTIME ERROR: cant return from empty callstack"
            );
        } else {
          this.display.fill(false);
          if (DEBUG) {
            console.log("CLEAR");
          }
        }
        break;
      case 1:
        // Combine the two bytes into a single integer (assuming big-endian order)
        this.pc = (secondNibble << 8) | (thirdNibble << 4) | fourthNibble;
        if (DEBUG) {
          console.log(
            `jump ${(secondNibble << 8) | (thirdNibble << 4) | fourthNibble}`
          );
        }
        break;

      case 2:
        this.stack.push(this.pc);
        this.pc = (secondNibble << 8) | (thirdNibble << 4) | fourthNibble;
        if (DEBUG) {
          console.log(
            `call ${(secondNibble << 8) | (thirdNibble << 4) | fourthNibble}`
          );
        }
        break;
      case 3:
        if (this.V[secondNibble] === ((thirdNibble << 4) | fourthNibble)) {
          this.pc += 2;
        }
        if (DEBUG) console.log("conditional");
        break;
      case 4:
        if (this.V[secondNibble] !== ((thirdNibble << 4) | fourthNibble)) {
          this.pc += 2;
        }
        if (DEBUG) console.log("conditional");
        break;
      case 5:
        if (this.V[secondNibble] === this.V[thirdNibble]) {
          this.pc += 2;
        }
        if (DEBUG) console.log("conditional");
        break;
      case 6:
        this.V[secondNibble] = (thirdNibble << 4) | fourthNibble;
        if (DEBUG)
          console.log(
            `set V${secondNibble.toString(16)} ${
              (thirdNibble << 4) | fourthNibble
            }`
          );
        break;
      case 7:
        this.V[secondNibble] += (thirdNibble << 4) | fourthNibble;
        if (DEBUG)
          console.log(
            `add V${secondNibble.toString(16)} ${
              (thirdNibble << 4) | fourthNibble
            }`
          );
        break;

      case 8:
        if (DEBUG) console.log("register operation");
        switch (fourthNibble) {
          case 0:
            this.V[secondNibble] = this.V[thirdNibble];
            break;
          case 1:
            this.V[secondNibble] |= this.V[thirdNibble];
            break;
          case 2:
            this.V[secondNibble] &= this.V[thirdNibble];
            break;
          case 3:
            this.V[secondNibble] ^= this.V[thirdNibble];
            break;
          case 4:
            this.V[secondNibble] += this.V[thirdNibble];
            break;
          case 5:
            this.V[0xf] = 1;
            if (this.V[secondNibble] < this.V[thirdNibble]) {
              this.V[0xf] = 0;
            }
            this.V[secondNibble] -= this.V[thirdNibble];
            break;
          case 7:
            this.V[0xf] = 1;
            if (this.V[thirdNibble] < this.V[secondNibble]) {
              this.V[0xf] = 0;
            }
            this.V[secondNibble] = this.V[thirdNibble] - this.V[secondNibble];
            break;
          case 6:
            //ambigious
            const bit = this.V[secondNibble] & 1;
            this.V[secondNibble] = this.V[secondNibble] >> 1;
            this.V[0xf] = bit ? 1 : 0;
            break;
          case 0xe:
            //ambigious
            const bit2 = (this.V[secondNibble] >> 7) & 1;
            this.V[secondNibble] = this.V[secondNibble] << 1;
            this.V[0xf] = bit2 ? 1 : 0;
            break;
          default:
            if (DEBUG) console.log("unknown intruction");
        }
        break;
      case 9:
        if (this.V[secondNibble] !== this.V[thirdNibble]) {
          this.pc += 2;
        }
        if (DEBUG) console.log("conditional");
        break;
      case 0xa:
        this.I = (secondNibble << 8) | (thirdNibble << 4) | fourthNibble;
        if (DEBUG)
          console.log(
            `set index ${
              (secondNibble << 8) | (thirdNibble << 4) | fourthNibble
            }`
          );
        break;
      case 0xb:
        //Ambiguous instruction!
        this.pc =
          (this.V[0] + (secondNibble << 8)) | (thirdNibble << 4) | fourthNibble;
        if (DEBUG)
          console.log(
            `jump offset V0 + ${
              (secondNibble << 8) | (thirdNibble << 4) | fourthNibble
            }`
          );
        break;
      case 0xc:
        const rand = Math.random() * 1000;
        this.V[secondNibble] = rand & ((thirdNibble << 4) | fourthNibble);
        if (DEBUG) console.log("random");
        break;

      case 0xd:
        this.draw(secondNibble, thirdNibble, fourthNibble);
        if (DEBUG)
          console.log(
            `draw ${firstNibble.toString(16)} ${secondNibble.toString(
              16
            )} ${thirdNibble.toString(16)}`
          );
        break;
      case 0xe:
        if (thirdNibble === 9) {
          if (this.keys[this.V[secondNibble]]) {
            this.pc += 2;
          }
          if (DEBUG) console.log("if keypress");
        } else if (thirdNibble === 0xa) {
          if (!this.keys[this.V[secondNibble]]) {
            this.pc += 2;
          }
          if (DEBUG) console.log("if not keypress");
        } else {
          if (DEBUG) console.log("invalid instruction");
        }
        break;
      case 0xf:
        switch (thirdNibble) {
          case 0:
            if (fourthNibble === 7) {
              this.V[secondNibble] = this.delayTimer;
            } else if (fourthNibble === 0xa) {
              // const keyspressed = this.keys.map((val, i) => ({"index": i, "value": val})).
              if (DEBUG) console.log("wait keypress");
              const keyPressedIndex = this.keys.findIndex((val) => val);
              if (keyPressedIndex !== -1) {
                this.V[secondNibble] = keyPressedIndex;
              } else {
                this.pc -= 2;
              }
            } else {
              if (DEBUG) console.log("invalid instruction");
            }
            break;
          case 1:
            switch (fourthNibble) {
              case 5:
                this.delayTimer = this.V[secondNibble];
                if (DEBUG) console.log("set delay timer");
                break;
              case 8:
                this.soundTimer = this.V[secondNibble];
                if (DEBUG) console.log("set sound timer");
                break;
              case 0xe:
                //obs
                this.I += this.V[secondNibble];
                if (DEBUG) console.log("add to index");
            }
            break;
          case 2:
            const char = this.V[secondNibble] & 0xf;
            this.I = 0x50 + char;
            if (DEBUG) console.log("font char");
            break;
          case 3:
            //tveksam om denna
            const firstdigit = Math.floor(this.V[secondNibble] / 100);
            const seconddigit = Math.floor((this.V[secondNibble] % 100) / 10);
            const thirddigit = this.V[secondNibble] % 10;
            this.memory[this.I] = firstdigit;
            this.memory[this.I + 1] = seconddigit;
            this.memory[this.I + 2] = thirddigit;
            break;
          case 5:
            const xregisters = this.V.slice(0, secondNibble + 1);
            this.memory.set(xregisters, this.I);
            if (DEBUG) console.log("store memory");
            break;
          case 6:
            //ambigous
            const xmemory = this.memory.slice(
              this.I,
              this.I + secondNibble + 1
            );
            this.V.set(xmemory);
            if (DEBUG) console.log("load memory");
            break;
          default:
            if (DEBUG) console.log("unknown instruction");
        }
        break;
      default:
        if (DEBUG)
          console.log(
            `UNIMPLEMENTED ${firstNibble.toString(16)}${secondNibble.toString(
              16
            )}${thirdNibble.toString(16)}${fourthNibble.toString(16)}`
          );
    }
  }
}
