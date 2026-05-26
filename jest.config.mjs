export default async () => {
  return {
    transform: {
      '^.+\\.tsx?$': 'babel-jest',
    },
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    extensionsToTreatAsEsm: ['.ts'],
    modulePathIgnorePatterns: ['<rootDir>/dist'],
    // Golden tests require TZ=UTC and have their own runner: `npm run test:golden`.
    // Excluded from the default suite so they don't break developer machines
    // running in non-UTC timezones.
    testPathIgnorePatterns: ['/node_modules/', '<rootDir>/test/golden/'],
    globals: {
      'ts-jest': {
        useESM: true,
      },
    },
    moduleNameMapper: {
      '^(\\.{1,2}/.*)\\.js$': '$1',
    },
  };
};