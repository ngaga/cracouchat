module.exports = {
  extends: [
    "next/core-web-vitals",
    "prettier",
    "eslint:recommended",
    "plugin:@next/next/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  plugins: [
    "simple-import-sort",
    "eslint-plugin-unused-imports",
  ],
  rules: {
    "import/no-cycle": "error",
    curly: ["error", "all"],
    "react/no-unescaped-entities": 0,
    "@typescript-eslint/consistent-type-imports": "error",
    "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
    "@typescript-eslint/no-explicit-any": 0,
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "unused-imports/no-unused-imports": "error",
    "no-case-declarations": 0,
    "@next/next/no-img-element": 0,
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        checksVoidReturn: false,
      },
    ],
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "jsx-a11y/alt-text": 0,
    "simple-import-sort/imports": [
      "error",
      {
        groups: [
          // Side effect imports.
          ["^\\u0000"],
          // Node.js builtins prefixed with `node:`.
          ["^node:"],
          // Packages.
          // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
          ["^@?\\w"],
          // @app imports.
          ["^@app"],
          // Absolute imports and other imports such as Vue-style `@/foo`.
          // Anything not matched in another group.
          ["^"],
          // Relative imports.
          // Anything that starts with a dot.
          ["^\\."],
        ],
      },
    ],
    "simple-import-sort/exports": "error",
    "@typescript-eslint/return-await": ["error", "in-try-catch"],
    "no-unused-expressions": "error",
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
};

