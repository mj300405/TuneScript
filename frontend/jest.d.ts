import '@types/jest';

declare global {
  const jest: typeof import('@jest/globals')['jest'];
  const expect: typeof import('@jest/globals')['expect'];
  const describe: typeof import('@jest/globals')['describe'];
  const it: typeof import('@jest/globals')['it'];
  const beforeEach: typeof import('@jest/globals')['beforeEach'];
  const afterEach: typeof import('@jest/globals')['afterEach'];
}