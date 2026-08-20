import { baseConfig } from "@pep-fit/config/eslint/base";

export default [...baseConfig, { ignores: ["src/generated/**"] }];
