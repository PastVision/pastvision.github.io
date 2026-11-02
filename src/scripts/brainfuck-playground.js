const root = document.querySelector("[data-bf-root]");

if (root && !root.dataset.initialized) {
  root.dataset.initialized = "true";
  const codeField = root.querySelector("[data-bf-code]");
  const inputField = root.querySelector("[data-bf-input]");
  const outputField = root.querySelector("[data-bf-output]");
  const statusField = root.querySelector("[data-bf-status]");
  const tapeField = root.querySelector("[data-bf-tape]");
  const pointerField = root.querySelector("[data-bf-pointer]");
  const helloWorld = `++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.`;
  const instructions = new Set("><+-.,[]");
  const cellCount = 200;

  function drawTape(memory, pointer) {
    tapeField.replaceChildren();
    const start = Math.max(0, Math.min(pointer - 8, cellCount - 18));
    for (let offset = 0; offset < 18; offset += 1) {
      const i = start + offset;
      const cell = document.createElement("div");
      cell.className = `bf-cell${i === pointer ? " is-pointer" : ""}`;
      const value = document.createElement("span");
      value.textContent = String(memory[i] ?? 0).padStart(3, "0");
      const index = document.createElement("small");
      index.textContent = String(i).padStart(3, "0");
      cell.append(value, index);
      tapeField.append(cell);
    }
    pointerField.textContent = `PTR ${String(pointer).padStart(3, "0")}`;
  }

  function runProgram() {
    const source = [...codeField.value].filter((char) => instructions.has(char)).join("");
    const jump = new Map();
    const stack = [];
    for (let i = 0; i < source.length; i += 1) {
      if (source[i] === "[") stack.push(i);
      if (source[i] === "]") {
        if (!stack.length) {
          statusField.textContent = "SYNTAX ERROR";
          outputField.textContent = `Unmatched closing bracket at instruction ${i}.`;
          return;
        }
        const open = stack.pop();
        jump.set(open, i);
        jump.set(i, open);
      }
    }
    if (stack.length) {
      statusField.textContent = "SYNTAX ERROR";
      outputField.textContent = `Unmatched opening bracket at instruction ${stack.pop()}.`;
      return;
    }

    const memory = new Uint8Array(cellCount);
    const stdin = [...inputField.value].map((char) => char.charCodeAt(0) & 255);
    let inputPointer = 0;
    let pointer = 0;
    let pc = 0;
    let steps = 0;
    let output = "";
    const maxSteps = 1_000_000;

    try {
      while (pc < source.length) {
        if (++steps > maxSteps) throw new Error("Execution stopped at the 1,000,000 instruction safety limit.");
        switch (source[pc]) {
          case ">": pointer = (pointer + 1) % cellCount; break;
          case "<": pointer = (pointer + cellCount - 1) % cellCount; break;
          case "+": memory[pointer] = (memory[pointer] + 1) & 255; break;
          case "-": memory[pointer] = (memory[pointer] + 255) & 255; break;
          case ".": output += String.fromCharCode(memory[pointer]); break;
          case ",":
            if (inputPointer >= stdin.length) throw new Error("Program requested input, but STDIN is empty or exhausted.");
            memory[pointer] = stdin[inputPointer++];
            break;
          case "[": if (memory[pointer] === 0) pc = jump.get(pc); break;
          case "]": if (memory[pointer] !== 0) pc = jump.get(pc); break;
        }
        pc += 1;
      }
      outputField.textContent = output || "(no output)";
      statusField.textContent = `HALTED · ${steps.toLocaleString()} STEPS`;
      drawTape(memory, pointer);
    } catch (error) {
      outputField.textContent = `${output}${output ? "\n\n" : ""}${error.message}`;
      statusField.textContent = "STOPPED";
      drawTape(memory, pointer);
    }
  }

  function reset() {
    outputField.textContent = "Your program output will appear here.";
    statusField.textContent = "READY";
    drawTape(new Uint8Array(cellCount), 0);
  }

  root.querySelector("[data-bf-run]").addEventListener("click", runProgram);
  root.querySelector("[data-bf-reset]").addEventListener("click", reset);
  root.querySelector("[data-bf-example]").addEventListener("click", () => {
    codeField.value = helloWorld;
    inputField.value = "";
    reset();
  });
  drawTape(new Uint8Array(cellCount), 0);
}
