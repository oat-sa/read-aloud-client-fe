// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies S.A.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';

export default [{
    input: 'sandbox/sandbox.js',
    plugins: [resolve(), commonjs(), babel({ babelHelpers: 'bundled' })],
    output: {
        file: 'sandbox/bundle.js',
        format: 'es',
        sourcemap: true
    },
    watch: {
        clearScreen: false
    }
}];
