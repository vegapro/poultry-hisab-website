import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('backend startup scripts', () => {
  it('loads backend/.env for local development and production starts', () => {
    const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts.dev).toBe('tsx watch --env-file=.env src/server.ts');
    expect(packageJson.scripts.start).toBe('node --env-file=.env dist/server.js');
  });
});
