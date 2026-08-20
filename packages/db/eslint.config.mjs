import { baseConfig } from "@gym-app/config/eslint/base";

export default [...baseConfig, { ignores: ["src/generated/**"] }];
