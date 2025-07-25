module.exports = {
  // Basic formatting
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  
  // JSX/TSX specific
  jsxSingleQuote: true,
  jsxBracketSameLine: false,
  
  // Other formatting rules
  bracketSpacing: true,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  quoteProps: 'as-needed',
  
  // File-specific overrides
  overrides: [
    {
      files: '*.{json,yml,yaml}',
      options: {
        printWidth: 80,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
      },
    },
    {
      files: '*.{ts,tsx,js,jsx}',
      options: {
        parser: 'typescript',
      },
    },
  ],
};