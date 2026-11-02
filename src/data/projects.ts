export type ProjectStatus = "active" | "complete" | "experimental" | "archived";

export interface Project {
  slug: string;
  name: string;
  eyebrow: string;
  summary: string;
  description: string;
  category: string;
  status: ProjectStatus;
  year: string;
  stack: string[];
  repo: string;
  featured: boolean;
  highlights: string[];
  notes?: string;
}

export const projects: Project[] = [
  {
    slug: "chip8-emulator",
    name: "CHIP-8 Emulator",
    eyebrow: "SYSTEMS / EMULATION",
    summary: "A CHIP-8 interpreter built from the ground up in C++ with an SDL display and keyboard input.",
    description: "A hands-on exploration of virtual machines, instruction decoding and the fundamentals of emulation. The project implements the CHIP-8 machine state, opcode execution, timers, keypad input and a 64×32 monochrome display.",
    category: "Systems",
    status: "complete",
    year: "2022",
    stack: ["C++", "SDL2", "Emulation"],
    repo: "https://github.com/PastVision/CHIP8",
    featured: true,
    highlights: [
      "Implemented the CHIP-8 memory map, registers, stack and program counter.",
      "Built an opcode fetch/decode/execute loop.",
      "Implemented sprite drawing, collision flags, timers and keypad input.",
      "Rendered the 64×32 display through SDL."
    ],
    notes: "An early emulator project and a useful foundation for more advanced console emulation."
  },
  {
    slug: "google-hash-code-2021",
    name: "Google Hash Code 2021",
    eyebrow: "ALGORITHMS / COMPETITIVE PROGRAMMING",
    summary: "Team Kernel Panic's solutions for the 2021 practice problem and online qualification round.",
    description: "A collaborative programming competition entry focused on translating large input datasets into high-scoring schedules and assignments. The repository contains separate practice and qualification solutions, input sets and output generation.",
    category: "Algorithms",
    status: "complete",
    year: "2021",
    stack: ["Python", "Heuristics", "Optimization"],
    repo: "https://github.com/PastVision/hashcode21",
    featured: true,
    highlights: [
      "Practice round total score: 725,290,298.",
      "Qualification round total score: 9,439,452.",
      "World rank: 1,296.",
      "India rank: 216.",
      "Delhi Technological Institute hub rank: 3."
    ]
  },
  {
    slug: "elden-ring-companion",
    name: "The Lands Between",
    eyebrow: "WEB APP / GAME COMPANION",
    summary: "A lightweight progression companion for tracking regions, bosses, Sites of Grace and questlines.",
    description: "A self-contained checklist application designed to make a sprawling action RPG easier to navigate. Its progression structure organizes the base game into recommended regions and brings route anchors, bosses, NPC quest summaries and ending checks into one interface.",
    category: "Web",
    status: "active",
    year: "2026",
    stack: ["HTML", "CSS", "JavaScript", "localStorage"],
    repo: "https://github.com/PastVision/eldenring",
    featured: true,
    highlights: [
      "Recommended progression across 18 regions.",
      "Curated boss and Site of Grace checklists.",
      "NPC quest summaries and mutually exclusive outcome warnings.",
      "Search across checklist entries.",
      "Browser-local progress persistence."
    ],
    notes: "The current repository version stores progress in the browser. Account-based synchronization is a separate planned enhancement, not a current feature."
  },
  {
    slug: "kuk-results",
    name: "KUK Results",
    eyebrow: "WEB / AUTOMATION",
    summary: "A university results project spanning a React web frontend and a Python results utility.",
    description: "A collection of tools built around accessing and presenting Kurukshetra University examination results. The Python utility handles result retrieval and output workflows, while the separate web repository contains a compiled React application.",
    category: "Web",
    status: "experimental",
    year: "2021",
    stack: ["Python", "React", "Web scraping"],
    repo: "https://github.com/PastVision/kuk-results-python",
    featured: true,
    highlights: [
      "Python utility for searching and saving results from the 2015 batch onward.",
      "HTML parsing and form-driven result retrieval.",
      "Separate React frontend repository."
    ],
    notes: "A legacy project. Its original university endpoint and dependencies may have changed."
  },
  {
    slug: "brainfuck-interpreter",
    name: "Brainfuck Interpreter",
    eyebrow: "LANGUAGES / INTERPRETERS",
    summary: "A compact Python interpreter for the Brainfuck esoteric programming language.",
    description: "A small language implementation exploring instruction filtering, a byte-oriented tape, pointer movement and loop execution.",
    category: "Systems",
    status: "complete",
    year: "2021",
    stack: ["Python", "Interpreters"],
    repo: "https://github.com/PastVision/brainfuck-interpreter-python",
    featured: false,
    highlights: [
      "Filters source input to the eight Brainfuck commands.",
      "Implements a wrapping tape pointer and 8-bit cells.",
      "Supports input, output and loop execution."
    ]
  },
  {
    slug: "sudoku-pygame",
    name: "Sudoku",
    eyebrow: "GAMES / INTERACTIVE SOFTWARE",
    summary: "A Pygame Sudoku interface with difficulty selection, candidate hints and a solver.",
    description: "A desktop puzzle experiment combining a graphical grid, user input and constraint checking through a separate solver module.",
    category: "Creative software",
    status: "experimental",
    year: "2021",
    stack: ["Python", "Pygame"],
    repo: "https://github.com/PastVision/Sudoku-PyGame",
    featured: false,
    highlights: [
      "Interactive 9×9 puzzle grid.",
      "Difficulty selection and puzzle generation.",
      "Candidate-number hints and erasing support."
    ]
  },
  {
    slug: "putty-server-adder",
    name: "PuTTY Server Adder",
    eyebrow: "DESKTOP TOOL / AUTOMATION",
    summary: "A PyQt utility for organizing server lists and generating PuTTY session registry entries.",
    description: "A Windows desktop utility that parses server lists into landscape-based groups and generates registry configuration for PuTTY sessions.",
    category: "Tools",
    status: "experimental",
    year: "2021",
    stack: ["Python", "PyQt5", "Windows Registry"],
    repo: "https://github.com/PastVision/PuttyServerAdder",
    featured: false,
    highlights: [
      "Parses landscape-oriented server lists.",
      "Generates PuTTY session registry entries.",
      "Provides a PyQt-based desktop interface."
    ],
    notes: "This repository needs a security and privacy review before being promoted. Do not expose internal hostnames, usernames, key paths or organization-specific infrastructure details."
  }
];

export const featuredProjects = projects.filter((project) => project.featured);
export const getProject = (slug: string) => projects.find((project) => project.slug === slug);
