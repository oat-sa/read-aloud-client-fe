// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies S.A.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License


module.exports = function babelConfig(api) {
    const isTest = api.env('test');
    api.cache(true);

    const plugins = [];
    let presets = ['@babel/preset-env'];

    // Jest+Babel configuration:
    if (isTest) {
        presets = [
            [
                '@babel/preset-env',
                {
                    targets: {
                        node: process.versions.node
                    }
                }
            ]
        ];
    }

    return {
        presets,
        plugins
    };
};
