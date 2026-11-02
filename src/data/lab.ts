export interface LabArea {
  number: string;
  title: string;
  description: string;
  tags: string[];
}

export const labAreas: LabArea[] = [
  {
    number: "01",
    title: "Emulation & systems",
    description: "Understanding machines by rebuilding their behaviour: interpreters, virtual hardware, graphics pipelines and compatibility layers.",
    tags: ["C++", "Emulators", "Vulkan", "Linux"]
  },
  {
    number: "02",
    title: "Reverse engineering",
    description: "Exploring executable formats, program behaviour, binary translation and the boundary between original platforms and new ones.",
    tags: ["Static analysis", "Recompilation", "Debugging"]
  },
  {
    number: "03",
    title: "Fabrication & hardware",
    description: "Turning digital designs into physical objects, experimenting with fit, tolerances, materials and small hardware projects.",
    tags: ["3D printing", "CAD", "Electronics"]
  },
  {
    number: "04",
    title: "Creative software",
    description: "Small experiments in interactive graphics, music, game development and tools that make ideas tangible.",
    tags: ["Creative coding", "Game development", "Audio"]
  }
];
