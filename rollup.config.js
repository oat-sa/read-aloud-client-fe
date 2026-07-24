// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies S.A.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default [
    {
        input: 'index.js',
        plugins: [resolve(), commonjs(), babel({ babelHelpers: 'bundled' }), terser()],
        output: {
            file: 'dist/index.js',
            format: 'iife',
            name: 'readAloudClient',
            exports: 'named',
            sourcemap: true
        }
    },
    {
        input: 'index.amd.js',
        plugins: [resolve(), commonjs(), babel({ babelHelpers: 'bundled' }), terser()],
        output: {
            file: 'dist/index.amd.js',
            format: 'amd',
            sourcemap: true
        }
    }
];
