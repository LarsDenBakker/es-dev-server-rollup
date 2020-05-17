import { startServer, createConfig, Config } from 'es-dev-server';
import { expect } from 'chai';
import fetch from 'node-fetch';
import path from 'path';

const host = 'http://localhost:8080/';

export async function setupServer(config: Partial<Config>) {
  const { server } = await startServer(
    createConfig({
      port: 8080,
      compatibility: 'none',
      rootDir: path.resolve(__dirname, 'fixture'),
      ...config,
    }),
  );
  return server;
}

export async function fetchText(url: string) {
  const response = await fetch(`${host}${url}`);

  expect(response.status).to.equal(200);
  return response.text();
}

export function expectIncludes(text: string, expected: string) {
  if (!text.includes(expected)) {
    throw new Error(`Expected "${expected}" in string: \n\n${text}`);
  }
}
