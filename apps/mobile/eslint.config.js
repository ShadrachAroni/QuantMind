const expo = require('eslint-config-expo/flat');

module.exports = [
  ...expo,
  {
    rules: {
      "no-unused-vars": "warn",
    },
    ignores: ["dist/**/*", ".expo/**/*", "node_modules/**/*"],
  },
];
