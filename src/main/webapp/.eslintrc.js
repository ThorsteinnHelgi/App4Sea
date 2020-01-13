module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    'airbnb-base',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    'linebreak-style': ['error', 'windows'],
    'no-plusplus': ["off"],
    'func-names': ["off"],
    'no-unused-vars': ["off"],
    'no-underscore-dangle': ["off"],
    'no-console': ["off"],
    'camelcase': ["off"],
    'max-len': ["off"],
    'no-tabs': ["off"],
    
    'no-bitwise': ["off"],
    //'no-use-before-define': ["off"],
    
    'no-param-reassign': ["off"],
    'no-continue': ["off"],
    'prefer-destructuring': ["off"],
    'no-extend-native': ["error", { "exceptions": ["String"] }],
    'no-lonely-if': ["off"],
    'no-self-compare': ["off"],
  },
};
