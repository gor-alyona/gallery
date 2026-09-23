import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,
    pool: 'forks',
    forks: {
      maxForks: 1,
      minForks: 1,
    },
  },
});
