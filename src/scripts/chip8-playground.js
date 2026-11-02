const root = document.querySelector("[data-chip8-root]");

if (root && !root.dataset.initialized) {
  root.dataset.initialized = "true";
  const canvas = root.querySelector("[data-chip8-screen]");
  const ctx = canvas.getContext("2d", { alpha: false });
  const status = root.querySelector("[data-chip8-status]");
  const pcReadout = root.querySelector("[data-chip8-pc]");
  const cyclesReadout = root.querySelector("[data-chip8-cycles]");
  const romReadout = root.querySelector("[data-chip8-rom]");
  const runButton = root.querySelector("[data-chip8-run]");
  const fileInput = root.querySelector("[data-chip8-file]");
  const keypad = root.querySelector("[data-chip8-keypad]");
  const WIDTH = 64;
  const HEIGHT = 32;
  const FONT = [
    0xF0,0x90,0x90,0x90,0xF0, 0x20,0x60,0x20,0x20,0x70,
    0xF0,0x10,0xF0,0x80,0xF0, 0xF0,0x10,0xF0,0x10,0xF0,
    0x90,0x90,0xF0,0x10,0x10, 0xF0,0x80,0xF0,0x10,0xF0,
    0xF0,0x80,0xF0,0x90,0xF0, 0xF0,0x10,0x20,0x40,0x40,
    0xF0,0x90,0xF0,0x90,0xF0, 0xF0,0x90,0xF0,0x10,0xF0,
    0xF0,0x90,0xF0,0x90,0x90, 0xE0,0x90,0xE0,0x90,0xE0,
    0xF0,0x80,0x80,0x80,0xF0, 0xE0,0x90,0x90,0x90,0xE0,
    0xF0,0x80,0xF0,0x80,0xF0, 0xF0,0x80,0xF0,0x80,0x80
  ];
  // Original key-controlled demo ROM: Q moves the sprite right; E moves it left.
  const keyMap = {
    "1":0x1,"2":0x2,"3":0x3,"4":0xC,
    "q":0x4,"w":0x5,"e":0x6,"r":0xD,
    "a":0x7,"s":0x8,"d":0x9,"f":0xE,
    "z":0xA,"x":0x0,"c":0xB,"v":0xF
  };
  const demoRom = new Uint8Array([
    0x00,0xE0, 0x60,0x0E, 0x61,0x0E, 0xA2,0x20,
    0x00,0xE0, 0xD0,0x15, 0x62,0x04, 0xE2,0x9E,
    0x12,0x18, 0x70,0x01, 0x12,0x08, 0x62,0x06,
    0xE2,0x9E, 0x12,0x08, 0x70,0xFF, 0x12,0x08,
    0xF0,0x90,0x90,0x90,0xF0
  ]);

  let memory, V, I, pc, stack, delayTimer, soundTimer, display, keys;
  let running = false;
  let animationId = 0;
  let lastFrame = 0;
  let cycleAccumulator = 0;
  let timerAccumulator = 0;
  let cycleCount = 0;
  let loadedName = "BUILT-IN DEMO";
  let waitingForKey = null;

  function resetMachine(rom = demoRom, name = "BUILT-IN DEMO") {
    pause();
    memory = new Uint8Array(4096);
    V = new Uint8Array(16);
    I = 0;
    pc = 0x200;
    stack = [];
    delayTimer = 0;
    soundTimer = 0;
    display = new Uint8Array(WIDTH * HEIGHT);
    keys = new Uint8Array(16);
    cycleCount = 0;
    timerAccumulator = 0;
    cycleAccumulator = 0;
    waitingForKey = null;
    memory.set(FONT, 0x50);
    memory.set(rom.slice(0, 4096 - 0x200), 0x200);
    loadedName = name;
    status.textContent = "READY";
    runButton.textContent = "Run";
    render();
    updateReadout();
  }

  function updateReadout() {
    pcReadout.textContent = pc.toString(16).toUpperCase().padStart(4, "0");
    cyclesReadout.textContent = String(cycleCount).padStart(6, "0");
    romReadout.textContent = loadedName.length > 18 ? `${loadedName.slice(0, 15)}...` : loadedName;
  }

  function render() {
    ctx.fillStyle = "#030704";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#8dffb0";
    for (let y = 0; y < HEIGHT; y += 1) {
      for (let x = 0; x < WIDTH; x += 1) {
        if (display[y * WIDTH + x]) ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  function cycle() {
    if (waitingForKey !== null) {
      const pressed = keys.findIndex((value) => value === 1);
      if (pressed === -1) return;
      V[waitingForKey] = pressed;
      waitingForKey = null;
    }
    const opcode = (memory[pc] << 8) | memory[(pc + 1) & 0xFFF];
    pc = (pc + 2) & 0xFFF;
    const x = (opcode >> 8) & 0xF;
    const y = (opcode >> 4) & 0xF;
    const n = opcode & 0xF;
    const kk = opcode & 0xFF;
    const nnn = opcode & 0x0FFF;
    const vx = V[x];
    const vy = V[y];

    switch (opcode & 0xF000) {
      case 0x0000:
        if (opcode === 0x00E0) display.fill(0);
        else if (opcode === 0x00EE) pc = stack.pop() ?? 0x200;
        break;
      case 0x1000: pc = nnn; break;
      case 0x2000: stack.push(pc); pc = nnn; break;
      case 0x3000: if (vx === kk) pc = (pc + 2) & 0xFFF; break;
      case 0x4000: if (vx !== kk) pc = (pc + 2) & 0xFFF; break;
      case 0x5000: if (n === 0 && vx === vy) pc = (pc + 2) & 0xFFF; break;
      case 0x6000: V[x] = kk; break;
      case 0x7000: V[x] = (vx + kk) & 0xFF; break;
      case 0x8000:
        switch (n) {
          case 0x0: V[x] = vy; break;
          case 0x1: V[x] = vx | vy; break;
          case 0x2: V[x] = vx & vy; break;
          case 0x3: V[x] = vx ^ vy; break;
          case 0x4: { const sum = vx + vy; V[0xF] = sum > 255 ? 1 : 0; V[x] = sum & 0xFF; break; }
          case 0x5: V[0xF] = vx >= vy ? 1 : 0; V[x] = (vx - vy) & 0xFF; break;
          case 0x6: V[0xF] = vx & 1; V[x] = vx >>> 1; break;
          case 0x7: V[0xF] = vy >= vx ? 1 : 0; V[x] = (vy - vx) & 0xFF; break;
          case 0xE: V[0xF] = (vx >> 7) & 1; V[x] = (vx << 1) & 0xFF; break;
        }
        break;
      case 0x9000: if (n === 0 && vx !== vy) pc = (pc + 2) & 0xFFF; break;
      case 0xA000: I = nnn; break;
      case 0xB000: pc = (nnn + V[0]) & 0xFFF; break;
      case 0xC000: V[x] = (Math.floor(Math.random() * 256) & kk); break;
      case 0xD000: {
        V[0xF] = 0;
        for (let row = 0; row < n; row += 1) {
          const sprite = memory[(I + row) & 0xFFF];
          for (let col = 0; col < 8; col += 1) {
            if ((sprite & (0x80 >> col)) === 0) continue;
            const px = (vx + col) % WIDTH;
            const py = (vy + row) % HEIGHT;
            const index = py * WIDTH + px;
            if (display[index]) V[0xF] = 1;
            display[index] ^= 1;
          }
        }
        break;
      }
      case 0xE000:
        if (kk === 0x9E && keys[vx & 0xF]) pc = (pc + 2) & 0xFFF;
        if (kk === 0xA1 && !keys[vx & 0xF]) pc = (pc + 2) & 0xFFF;
        break;
      case 0xF000:
        switch (kk) {
          case 0x07: V[x] = delayTimer; break;
          case 0x0A: waitingForKey = x; pc = (pc - 2) & 0xFFF; break;
          case 0x15: delayTimer = vx; break;
          case 0x18: soundTimer = vx; break;
          case 0x1E: I = (I + vx) & 0xFFF; break;
          case 0x29: I = 0x50 + ((vx & 0xF) * 5); break;
          case 0x33:
            memory[I] = Math.floor(vx / 100);
            memory[(I + 1) & 0xFFF] = Math.floor((vx % 100) / 10);
            memory[(I + 2) & 0xFFF] = vx % 10;
            break;
          case 0x55:
            for (let i = 0; i <= x; i += 1) memory[(I + i) & 0xFFF] = V[i];
            break;
          case 0x65:
            for (let i = 0; i <= x; i += 1) V[i] = memory[(I + i) & 0xFFF];
            break;
        }
        break;
    }
    cycleCount += 1;
  }

  function frame(timestamp) {
    if (!running) return;
    if (!lastFrame) lastFrame = timestamp;
    const elapsed = Math.min(timestamp - lastFrame, 50);
    lastFrame = timestamp;
    cycleAccumulator += elapsed * 8;
    timerAccumulator += elapsed;
    while (timerAccumulator >= (1000 / 60)) {
      if (delayTimer > 0) delayTimer -= 1;
      if (soundTimer > 0) soundTimer -= 1;
      timerAccumulator -= (1000 / 60);
    }
    let cycles = Math.floor(cycleAccumulator);
    cycleAccumulator -= cycles;
    while (cycles-- > 0) cycle();
    render();
    updateReadout();
    animationId = requestAnimationFrame(frame);
  }

  function run() {
    if (running) return;
    running = true;
    lastFrame = 0;
    status.textContent = "RUNNING";
    runButton.textContent = "Pause";
    animationId = requestAnimationFrame(frame);
  }

  function pause() {
    running = false;
    cancelAnimationFrame(animationId);
    if (runButton) runButton.textContent = "Run";
  }

  function toggleRun() {
    if (running) {
      pause();
      status.textContent = "PAUSED";
    } else run();
  }

  function pressKey(key, pressed) {
    keys[key] = pressed ? 1 : 0;
    const button = keypad.querySelector(`[data-chip8-key="${key.toString(16).toUpperCase()}"]`);
    if (button) button.classList.toggle("is-pressed", Boolean(pressed));
  }

  window.addEventListener("keydown", (event) => {
    const key = keyMap[event.key.toLowerCase()];
    if (key !== undefined) {
      event.preventDefault();
      pressKey(key, true);
    }
  });
  window.addEventListener("keyup", (event) => {
    const key = keyMap[event.key.toLowerCase()];
    if (key !== undefined) pressKey(key, false);
  });
  window.addEventListener("blur", () => {
    keys.fill(0);
    keypad.querySelectorAll(".is-pressed").forEach((button) => button.classList.remove("is-pressed"));
  });

  keypad.querySelectorAll("[data-chip8-key]").forEach((button) => {
    const key = Number.parseInt(button.dataset.chip8Key, 16);
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      pressKey(key, true);
    });
    const release = () => pressKey(key, false);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
  });

  runButton.addEventListener("click", toggleRun);
  root.querySelector("[data-chip8-step]").addEventListener("click", () => {
    pause();
    try {
      cycle();
      render();
      updateReadout();
      status.textContent = "STEPPED";
    } catch (error) {
      status.textContent = "CPU ERROR";
      console.error(error);
    }
  });
  root.querySelector("[data-chip8-reset]").addEventListener("click", () => resetMachine());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.length === 0 || bytes.length > 3584) {
      status.textContent = "INVALID ROM SIZE";
      fileInput.value = "";
      return;
    }
    resetMachine(bytes, file.name.toUpperCase());
    status.textContent = "ROM LOADED";
  });
  resetMachine();
}
