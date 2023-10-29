module.exports = {
  extends: ['@ts-recommended/react'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: './**/tsconfig.json',
      },
      plugins: ['unused-imports'],
    },
  ],
};
