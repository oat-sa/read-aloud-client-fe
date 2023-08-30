/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2021-2023 (original work) Open Assessment Technologies SA ;
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
                destroy
            })
        );
        return getReadAloudClient('custom').then(client => {
            let element = window.document.body;

            client.setPreferences();
            client.ignoreElements('.selector');
            client.play(element);
            client.stop();

            client.isReading();
            client.playSelection();
            client.stop();

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
});
