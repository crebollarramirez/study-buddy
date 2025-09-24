const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "^@tests/(.*)$": "<rootDir>/tests/$1",
    "^src/(.*)$": "<rootDir>/src/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  moduleDirectories: ["node_modules", "src"],
  transform: {
    ...tsJestTransformCfg,
  },
};
