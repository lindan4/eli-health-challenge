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
  setupFilesAfterEnv: ["./src/tests/setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/src/tests/setup.ts"],
};
