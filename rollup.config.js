import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from 'rollup-plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import serve from 'rollup-plugin-serve';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';

const dev = process.env.ROLLUP_WATCH;

const serveopts = {
  contentBase: ['./dist'], 
  host: '0.0.0.0',
  port: 5000,
  allowCrossOrigin: true,
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
};

const plugins = [
  postcss({
    plugins: [],
  }),
  nodeResolve({}),
  commonjs(),
  typescript(),
  json(),
  babel({
    exclude: 'node_modules/**',
  }),
  dev && serve(serveopts),
  !dev && terser(),
];

export default [
  {
    input: 'src/swipe-glance-card.ts',
    output: {
      dir: 'dist',
      format: 'es',
    },
    plugins: [...plugins],
  },
];
