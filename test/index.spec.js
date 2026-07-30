/**
 * SPDX-FileCopyrightText: 2021-2026 Open Assessment Technologies S.A.
 * Copyright (C) 2026 (original work) Open Assessment Technologies S.A.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
 */

import getReadAloudClient, { getAvailableProviders } from '../index.js';

jest.mock('../lib/providers/index.js', () => {
    const originalModule = jest.requireActual('../lib/providers/index.js');
    return Object.assign(
        {
            __esModule: true
        },
        originalModule,
        {
            invalid: jest.fn(() =>
                Promise.resolve({
                    play: jest.fn(),
                    pause: jest.fn()
                })
            ),

            custom: jest.fn()
        }
    );
});

import * as providers from '../lib/providers/index.js';

describe('get available providers', () => {
    it('should return providers ids', () => {
        expect(getAvailableProviders()).toContain('native');
        expect(getAvailableProviders()).toContain('readweb');
        expect(getAvailableProviders()).toContain('texthelp');
    });
});

describe('get read aloud client', () => {
    it('fails without a provider', () =>
        expect(getReadAloudClient()).rejects.toMatchObject({ message: 'Provider undefined not found.' }));
    it('fails for an unknown provider', () =>
        expect(getReadAloudClient('foo')).rejects.toMatchObject({ message: 'Provider foo not found.' }));

    it('fails when the provider is not valid', () =>
        getReadAloudClient('invalid').catch(err => {
            expect(err.message).toEqual('The provider invalid does not comply with the API.');
        }));

    it('loads a provider', () => {
        providers.custom.mockImplementation(() =>
            Promise.resolve({
                play: jest.fn(),
                playSelection: jest.fn(),
                stop: jest.fn(),
                destroy: jest.fn()
            })
        );
        return getReadAloudClient('custom').then(() => {
            expect(providers.custom).toHaveBeenCalled();
        });
    });

    it('client calls are forwarded to the provider', () => {
        const play = jest.fn();
        const playSelection = jest.fn();
        const stop = jest.fn();
        const setPreferences = jest.fn();
        const ignoreElements = jest.fn();
        const isReading = jest.fn();
        const onReadStart = jest.fn();
        const onReadEnd = jest.fn();
        const destroy = jest.fn();
        const getSupport = jest.fn();
        providers.custom.mockImplementation(() =>
            Promise.resolve({
                play,
                playSelection,
                stop,
                setPreferences,
                ignoreElements,
                isReading,
                onReadStart,
                onReadEnd,
                destroy,
                getSupport
            })
        );
        return getReadAloudClient('custom').then(client => {
            let element = window.document.body;

            client.getSupport();
            client.setPreferences();
            client.ignoreElements('.selector');
            client.play(element);
            client.stop();

            client.isReading();
            client.playSelection();
            client.stop();

            expect(getSupport).toHaveBeenCalled();
            expect(setPreferences).toHaveBeenCalled();
            expect(ignoreElements).toHaveBeenNthCalledWith(1, '.selector');
            expect(play).toHaveBeenNthCalledWith(1, element);
            expect(playSelection).toHaveBeenCalledTimes(1);
            expect(stop).toHaveBeenCalledTimes(2);
            expect(isReading).toHaveBeenCalledTimes(1);

            const startHandler = jest.fn();
            client.onReadStart(startHandler);

            const endHandler = jest.fn();
            client.onReadEnd(endHandler);

            expect(onReadStart).toHaveBeenNthCalledWith(1, startHandler);
            expect(onReadEnd).toHaveBeenNthCalledWith(1, endHandler);

            client.destroy();
            expect(destroy).toHaveBeenCalled();
        });
    });
    it('returns "all enabled" constraints for native provider in getSupport', () => {
        const play = jest.fn();
        const playSelection = jest.fn();
        const stop = jest.fn();
        const destroy = jest.fn();

        providers.custom.mockImplementation(() =>
            Promise.resolve({
                play,
                playSelection,
                stop,
                destroy,
            })
        );
        return getReadAloudClient('custom').then(client => {
            expect(client.getSupport()).toStrictEqual(
                {
                    "pitch": {
                        "disabled": false
                    },
                    "speed": {
                        "disabled": false,
                        "options": [
                            "slowest",
                            "slow",
                            "normal",
                            "fast",
                            "fastest"
                        ]
                    },
                    "voice": {
                        "disabled": false
                    },
                    "clickToSpeak": false
                }
            );
        });
    });
});
