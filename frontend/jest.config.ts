import type { Config } from '@jest/types';
import { defaults } from 'jest-config';

const config: Config.InitialOptions = {
  ...defaults,
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFiles: ['jest-canvas-mock'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^react-pdf$': '<rootDir>/__mocks__/react-pdf.tsx',
    '^next/router$': '<rootDir>/__mocks__/next/router.ts',
    '^next/image$': '<rootDir>/__mocks__/next/image.ts',
    '^@apollo/client$': '<rootDir>/__mocks__/@apollo-client.ts',
    '^graphql-upload$': '<rootDir>/__mocks__/graphql-upload.ts',
    '^framer-motion$': '<rootDir>/__mocks__/framer-motion.ts',
    "^lucide-react$": "<rootDir>/__mocks__/lucide-react.tsx",
    '^canvas$': '<rootDir>/__mocks__/canvas.js',
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.jest.json',
    }],
  },
};

export default config;