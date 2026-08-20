import { baseConfig } from "@pep-fit/config/eslint/base";

export default [
  ...baseConfig,
  {
    files: ["*.config.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        module: "writable",
        require: "readonly",
        __dirname: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];
