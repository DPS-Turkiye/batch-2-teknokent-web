import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import pluginQuery from "@tanstack/eslint-plugin-query";
import vitest from "@vitest/eslint-plugin";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

// Import order is owned by Prettier (@ianvs/prettier-plugin-sort-imports), not ESLint.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...pluginQuery.configs["flat/recommended"],
  comments.recommended,
  {
    rules: {
      // A suppression says why: `// eslint-disable-next-line rule -- reason`.
      "@eslint-community/eslint-comments/require-description": [
        "error",
        { ignore: ["eslint-enable"] },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
      reportUnusedInlineConfigs: "error",
    },
    rules: {
      eqeqeq: ["error", "smart"],
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-implicit-coercion": "error",
      "no-param-reassign": "error",
      "no-promise-executor-return": "error",
      "no-self-compare": "error",
      "no-template-curly-in-string": "error",
      "no-unmodified-loop-condition": "error",
      "no-unreachable-loop": "error",
      "object-shorthand": "error",
      "prefer-const": "error",
      "react/jsx-no-leaked-render": [
        "error",
        { validStrategies: ["ternary", "coerce"] },
      ],
      "react/jsx-no-useless-fragment": ["error", { allowExpressions: true }],
      "react/no-array-index-key": "error",
      "react/self-closing-comp": "error",
    },
  },
  {
    files: ["**/*.{ts,tsx,mts}"],
    extends: [
      tseslint.configs.strictTypeCheckedOnly,
      tseslint.configs.stylisticTypeCheckedOnly,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "as",
          objectLiteralTypeAssertions: "allow-as-parameter",
        },
      ],
      // These two silence the type checker instead of satisfying it. A plain `x as unknown`
      // (to narrow untrusted data afterwards) stays allowed.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            'TSAsExpression > TSAsExpression.expression[typeAnnotation.type="TSUnknownKeyword"]',
          message:
            "`as unknown as T` hides a type mismatch: fix the types, or build a complete typed value (test/mocks/query-results.ts, test/fixtures).",
        },
        {
          selector: 'TSAsExpression[typeAnnotation.type="TSNeverKeyword"]',
          message:
            "`as never` turns off type checking for the value: fix the types, or build a complete typed value.",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
          disallowTypeAnnotations: false,
        },
      ],
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        { ignoreArrowShorthand: true },
      ],
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/no-unused-expressions": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      // `label || fallback` on strings is usually meant to also replace "".
      "@typescript-eslint/prefer-nullish-coalescing": [
        "error",
        { ignorePrimitives: { string: true } },
      ],
      "@typescript-eslint/require-array-sort-compare": [
        "error",
        { ignoreStringArrays: true },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        {
          considerDefaultExhaustiveForUnions: true,
          requireDefaultForNonUnion: true,
        },
      ],
    },
  },
  {
    files: ["test/**/*.{ts,tsx}"],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      "vitest/no-disabled-tests": "error",
      "vitest/no-focused-tests": "error",
      "vitest/no-standalone-expect": "error",
      "vitest/prefer-called-exactly-once-with": "off",
      // Mocks and fixtures are loosely typed by nature; type safety in tests
      // comes from `tsc -p test`, not from the no-unsafe-* family.
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/unbound-method": "off",
      "react/no-array-index-key": "off",
    },
    settings: { vitest: { typecheck: true } },
  },
  prettier,
]);

export default eslintConfig;
