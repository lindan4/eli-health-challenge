export default {
  preset: "ts-jest",
  testEnvironment: "node",
  // ✨ ADD THIS LINE
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts?$": ["ts-jest", { useESM: true }],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  setupFilesAfterEnv: ["./src/__tests__/setup.ts"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/src/__tests__/setup.ts",
  ],
};
