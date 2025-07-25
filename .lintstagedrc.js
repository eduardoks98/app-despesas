module.exports = {
  // TypeScript and JavaScript files
  '*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  
  // JSON, YAML, and Markdown files
  '*.{json,yml,yaml,md}': [
    'prettier --write',
  ],
  
  // Package.json files
  'package.json': [
    'prettier --write',
  ],
  
  // CSS and SCSS files
  '*.{css,scss,less}': [
    'prettier --write',
  ],
  
  // HTML files
  '*.html': [
    'prettier --write',
  ],
  
  // Specific workspace files
  'apps/**/*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  
  'packages/**/*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
  ],
};