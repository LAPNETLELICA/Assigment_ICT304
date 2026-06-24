import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    env: { NODE_ENV: 'test' },
    include: [
      'test/**/*.test.js',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.js'],
      exclude: [
        'src/server.js',           // entry point — covered indirectly via supertest
        'src/bank-system/test_banking.js', // exploratory script, not production code
      ],
    },
  },
});

