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
  stack: never[];
  delayTimer: number;
  soundTimer: number;
  display: boolean[];
  keys: boolean[];
  constructor() {
    this.memory = new Uint8Array(4096);
    this.V = new Uint8Array(16); // Registers V0 to VF
    this.I = 0; // Index register
    this.pc = 0x200; // Program counter starts at 0x200
    this.stack = [];
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.display = new Array(64 * 32).fill(false); // Display initialized to off
    this.keys = new Array(16).fill(false); // Key states
    this.memory.set(chip8FontSet, 0x50);
  }

  getDisplay() {
    return this.display;
  }

  // Initialize emulator with ROM
  loadRom(rom: ArrayBuffer) {
    // Load ROM into memory starting at 0x200
    this.memory.set(new Uint8Array(rom), 0x200);
  }

  toggleVF(on: boolean) {
    this.V[0xf] = on ? 1 : 0;
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

  // Emulator cycle
  async cycle() {
    // Fetch, decode, and execute instructions
    while (true) {
      const firstNibble = this.memory[this.pc] >> 4;
      const secondNibble = this.memory[this.pc] & 0xf;
      const thirdNibble = this.memory[this.pc + 1] >> 4;
      const fourthNibble = this.memory[this.pc + 1] & 0xf;

      switch (firstNibble) {
        case 0:
          this.display.fill(false);
          this.pc += 2;
          break;
        case 1:
          // Combine the two bytes into a single integer (assuming big-endian order)
          this.pc = (secondNibble << 8) | (thirdNibble << 4) | fourthNibble;
          break;

        case 6:
          this.V[secondNibble] = (thirdNibble << 4) | fourthNibble;
          this.pc += 2;
          break;
        case 7:
          this.V[secondNibble] += (thirdNibble << 4) | fourthNibble;
          this.pc += 2;
          break;

        case 0xa:
          this.I = (secondNibble << 8) | (thirdNibble << 4) | fourthNibble;
          this.pc += 2;
          break;

        case 0xd:
          this.draw(secondNibble, thirdNibble, fourthNibble);
          break;
        default:
      }
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 100));
    }
  }
}
