import { defineConfig, globalIgnores } from "eslint/config";
import pluginQuery from "@tanstack/eslint-plugin-query";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...pluginQuery.configs["flat/recommended"],
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  prettier,
]);

export default eslintConfig;
