module.exports = {
  root: true,
  extends: ['@react-native'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/no-shadow': ['error'],
        'no-shadow': 'off',
        'no-undef': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'react-native/no-unused-styles': 'off',
        'react-native/split-platform-components': 'off',
        'react-native/no-inline-styles': 'off',
        'react-native/no-color-literals': 'off',
      },
    },
  ],
};
