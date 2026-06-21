import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import resolve from '@rollup/plugin-node-resolve';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

// Inline replacement for rollup-plugin-copy (unmaintained; pulled deprecated
// glob@7 + inflight transitively). Copies static assets into dist/ and writes a
// publish-ready package.json after the bundle is written.
function copyDistAssets() {
  return {
    name: 'copy-dist-assets',
    closeBundle() {
      mkdirSync('dist', { recursive: true });
      for (const file of ['README.md', 'MIGRATION.md', 'LICENSE', 'llms.txt']) {
        copyFileSync(file, `dist/${file}`);
      }
      const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
      const importType = './esm/index.js';
      const requireType = './commonjs/index.cjs';
      const types = './index.d.ts';
      pkg.main = requireType;
      pkg.module = importType;
      pkg.types = types;
      pkg.exports = { import: importType, require: requireType, types };
      // Strip fields that only matter for development; they bloat the installed
      // tarball and confuse consumers who inspect node_modules.
      delete pkg.scripts;
      delete pkg.devDependencies;
      delete pkg.overrides; // dev-only npm resolution hints; inert for consumers
      delete pkg.publishConfig;
      delete pkg.gitHead;
      writeFileSync('dist/package.json', JSON.stringify(pkg, null, 2));
    },
  };
}

const config = [
  {
    input: 'src/index.ts',
    output: [
        {
           file: 'dist/commonjs/index.cjs',
           format: 'cjs',
           sourcemap: true,
        },
        {
            file: 'dist/esm/index.js',
            format: 'esm',
            sourcemap: true,
         }
    ],
    external: [ '@types/node', '@types/luxon', 'luxon', 'typescript' ],
    plugins: [
        resolve(),
        // Note: not minifying with terser. The serialize-javascript dep in
        // @rollup/plugin-terser breaks on Node 18 and on Windows. The bundle
        // is already tiny (~8KB ESM); downstream bundlers minify in apps that
        // need it.
        typescript({
          tsconfig: 'tsconfig.json',
          // The dts step below uses rollup-plugin-dts to emit a single
          // bundled dist/index.d.ts. Disable per-file declarations here to
          // avoid the @rollup/plugin-typescript path-escaping bug.
          declaration: false,
          declarationDir: undefined,
        }),
        copyDistAssets()
    ]
  }, {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es'
    },
    plugins: [
        dts({
          tsconfig: 'tsconfig.json'
        })
    ]
  }
];
export default config;