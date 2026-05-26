import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import copy from 'rollup-plugin-copy';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

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
        terser(),
        typescript({
          tsconfig: 'tsconfig.json',
          // The dts step below uses rollup-plugin-dts to emit a single
          // bundled dist/index.d.ts. Disable per-file declarations here to
          // avoid the @rollup/plugin-typescript path-escaping bug.
          declaration: false,
          declarationDir: undefined,
        }),
        copy({
          targets: [
            { src: ["README.md", "MIGRATION.md", "LICENSE"], dest: "dist" },
            {
              src: 'package.json',
              dest: 'dist',
              transform: (contents) => {
                const pkg = JSON.parse(contents.toString());
                const importType = "./esm/index.js";
                const requireType = "./commonjs/index.cjs";
                const types = "./index.d.ts";
                pkg.main = requireType;
                pkg.module = importType;
                pkg.types = types;
                pkg.exports = {
                  import: importType,
                  require: requireType,
                  types: types
                };
                // Strip fields that only matter for development; they bloat the
                // installed tarball and confuse consumers who inspect node_modules.
                delete pkg.scripts;
                delete pkg.devDependencies;
                delete pkg.publishConfig;
                delete pkg.gitHead;
                return JSON.stringify(pkg, null, 2);
              }
            }
          ]
        })
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