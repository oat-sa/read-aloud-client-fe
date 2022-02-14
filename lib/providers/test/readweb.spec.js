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
 * Copyright (c) 2021-2022 (original work) Open Assessment Technologies SA ;
 */

import getReadAloudClient, { getAvailableProviders } from '../../../index.js';
import { fireEvent } from '@testing-library/dom';
import { voices, speeds, pitches } from '../../preferences.js';
import { getSelectionAncestor } from '../../util/selection.js';

jest.mock('../../util/selection.js', () => ({
    isTextSelected: jest.fn(() => true),
    getSelectionAncestor: jest.fn(() => null)
}));

describe('readweb provider', () => {
    const container = document.createElement('div');
    container.id = 'fixtures';
    document.body.appendChild(container);

    afterEach(() => {
        const readwebScript = document.querySelector('script[data-tts="readweb"]');
        if (readwebScript) {
            readwebScript.parentNode.removeChild(readwebScript);
        }
        container.innerHTML = '';
        delete window.startleseweb;

        jest.clearAllMocks();
    });
    afterAll(() => {
        document.body.removeChild(container);
    });

    const readwebEntrypoint = jest.fn();
    function mockReadwebScript() {
        const script = document.querySelector('script[data-tts="readweb"]');
        //mock the script and iframe loading
        script.onload = jest.fn();
        const internalFrame = document.createElement('iframe');
        internalFrame.id = 'vFact_audioFrame';
        container.appendChild(internalFrame);
        jest.spyOn(internalFrame, 'contentWindow', 'get').mockReturnValue({
            vFactDetect2: true,
            close: jest.fn()
        });

        window.startleseweb = readwebEntrypoint;

        fireEvent.load(script);
    }

    it('has the provider', () => {
        expect(getAvailableProviders()).toContain('readweb');
    });

    it('fails to load the provider without a confiured URL', () =>
        getReadAloudClient('readweb', { license: 'abc' }).catch(err => {
            expect(err.message).toEqual(`Missing service URL in the configuration 'config.url'`);
        }));

    it('fails to load the provider without a license key', () =>
        getReadAloudClient('readweb', { url: '/abc' }).catch(err => {
            expect(err.message).toEqual(`Missing license key in the configuration 'config.license'`);
        }));

    it('loads the readweb script', () => {
        expect(document.querySelectorAll('script[data-tts="readweb"]')).toHaveLength(0);

        return Promise.all([getReadAloudClient('readweb', { url: './abc', license: 'foo' }), mockReadwebScript()]).then(
            results => {
                const script = document.querySelector('script[data-tts="readweb"]');
                expect(script.src).toContain('/abc/foo.js');
                expect(script.dataset.loaded).toBeTruthy();

                const client = results[0];
                expect(client).toMatchObject({
                    play: expect.any(Function),
                    playSelection: expect.any(Function),
                    stop: expect.any(Function),
                    ignoreElements: expect.any(Function),
                    setPreferences: expect.any(Function),
                    isReading: expect.any(Function),
                    onReadStart: expect.any(Function),
                    onReadEnd: expect.any(Function)
                });

                expect(readwebEntrypoint).toHaveBeenCalledTimes(1);
            }
        );
    });

    it('loads the readweb script in dev mode', () => {
        expect(document.querySelectorAll('script[data-tts="readweb"]')).toHaveLength(0);

        return Promise.all([
            getReadAloudClient('readweb', { url: './efg', license: 'bar', dev: true }),
            mockReadwebScript()
        ]).then(() => {
            const script = document.querySelector('script[data-tts="readweb"]');
            expect(script.src).toContain('/efg/test-bar.js');
            expect(readwebEntrypoint).toHaveBeenCalledTimes(1);
        });
    });

    it('rejects if readweb script loading is in timeout', () =>
        getReadAloudClient('readweb', { url: './abc', license: 'foo', loadingTimeoutMs: 100 }).catch(err => {
            const script = document.querySelector('script[data-tts="readweb"]');
            expect(script.dataset.loaded).toBeFalsy();

            expect(err.message).toEqual('Timeout: unable to load the read web script');
        }));

    it('plays from a dom element', () =>
        Promise.all([getReadAloudClient('readweb', { url: './abc', license: 'foo' }), mockReadwebScript()]).then(
            results => {
                const client = results[0];

                const playHandler = jest.fn();
                window.vFact_playsection = playHandler;

                container.innerHTML = '<p>Some text to read</p>';
                const element = container.querySelector('p');
                expect(element.id).toEqual('');

                client.play(element);
                expect(element.id.length).toBeGreaterThan(0);
                expect(playHandler).toHaveBeenCalledWith(element.id);
            }
        ));

    it('plays from a selection', () =>
        Promise.all([getReadAloudClient('readweb', { url: './abc', license: 'foo' }), mockReadwebScript()]).then(
            results => {
                const client = results[0];

                const playHandler = jest.fn();
                window.vFact_doplay = playHandler;

                client.playSelection();
                expect(playHandler).toHaveBeenCalled();
            }
        ));

    it('stops playing', () =>
        Promise.all([getReadAloudClient('readweb', { url: './abc', license: 'foo' }), mockReadwebScript()]).then(
            results => {
                const client = results[0];

                const stopHandler = jest.fn();
                window.vFact_dostop = stopHandler;

                client.stop();
                expect(stopHandler).toHaveBeenCalled();
            }
        ));

    it('listen for reading state', () => {
        let changeHandler;
        let reading = 0;
        window.vFact_HTML5Player = {
            setEventHandler_OnChangePlaylistStatus(callback) {
                changeHandler = callback;
            }
        };

        return Promise.all([getReadAloudClient('readweb', { url: './abc', license: 'foo' }), mockReadwebScript()]).then(
            results => {
                const client = results[0];

                window.vFact_HTML5Player.setEventHandler_OnChangePlaylistStatus(changeHandler);

                window.vFact_doplay = () => {
                    reading = 1;
                    changeHandler(reading);
                };
                window.vFact_dostop = () => {
                    reading = 0;
                    changeHandler(reading);
                };

                const readStartHandler = jest.fn();
                client.onReadStart(readStartHandler);

                const readEndHandler = jest.fn();
                client.onReadEnd(readEndHandler);

                expect(client.isReading()).toBeFalsy();
                expect(readStartHandler).not.toHaveBeenCalled();
                expect(readEndHandler).not.toHaveBeenCalled();

                client.playSelection();

                expect(client.isReading()).toBeTruthy();
                expect(readStartHandler).toHaveBeenCalledTimes(1);
                expect(readEndHandler).not.toHaveBeenCalled();

                client.stop();

                expect(client.isReading()).toBeFalsy();
                expect(readStartHandler).toHaveBeenCalledTimes(1);
                expect(readEndHandler).toHaveBeenCalledTimes(1);
            }
        );
    });

    it('ignore configured elements', () =>
        Promise.all([getReadAloudClient('readweb', { url: './abc', license: 'foo' }), mockReadwebScript()]).then(
            results => {
                const client = results[0];

                container.innerHTML = '<p>Some text to <span class="ignore-me">ignore</span> read</p>';

                expect(container.querySelectorAll('.vFact_DoNotReadAloud')).toHaveLength(0);

                client.ignoreElements('.ignore-me');
                client.play(container);

                expect(container.querySelectorAll('.vFact_DoNotReadAloud')).toHaveLength(1);
            }
        ));

    it('swap and restore the lang attribute', () => {
        let changeHandler;
        window.vFact_HTML5Player = {
            setEventHandler_OnChangePlaylistStatus(callback) {
                changeHandler = callback;
            }
        };

        return Promise.all([getReadAloudClient('readweb', { url: './abc', license: 'foo' }), mockReadwebScript()]).then(
            results => {
                window.vFact_HTML5Player.setEventHandler_OnChangePlaylistStatus(changeHandler);

                const client = results[0];

                container.innerHTML = `
        <main>
            <section lang="nb_NO">
                <div>
                    <p>Some text</p>
                </div>
            </section>
        </main>`;

                const section = container.querySelector('section');
                const element = container.querySelector('p');

                expect(section.getAttribute('lang')).toEqual('nb_NO');
                expect(section.dataset.ttsOriginalLang).toBeFalsy();

                client.play(element);

                expect(section.getAttribute('lang')).toEqual('no');
                expect(section.dataset.ttsOriginalLang).toEqual('nb_NO');

                changeHandler(0); //reading ends

                expect(section.getAttribute('lang')).toEqual('nb_NO');
                expect(section.dataset.ttsOriginalLang).toBeFalsy();
            }
        );
    });

    it('maps the lang attribute', () => {
        let changeHandler;
        window.vFact_HTML5Player = {
            setEventHandler_OnChangePlaylistStatus(callback) {
                changeHandler = callback;
            }
        };

        return Promise.all([getReadAloudClient('readweb', { url: './abc', license: 'foo' }), mockReadwebScript()]).then(
            results => {
                window.vFact_HTML5Player.setEventHandler_OnChangePlaylistStatus(changeHandler);

                const client = results[0];

                container.innerHTML = `
        <main>
            <section lang="da">
                <div>
                    <p>Some text</p>
                </div>
            </section>
        </main>`;

                const section = container.querySelector('section');
                const element = container.querySelector('p');

                expect(section.getAttribute('lang')).toEqual('da');
                expect(section.dataset.ttsOriginalLang).toBeFalsy();

                client.play(element);

                expect(section.getAttribute('lang')).toEqual('dk');
                expect(section.dataset.ttsOriginalLang).toEqual('da');

                changeHandler(0); //reading ends

                expect(section.getAttribute('lang')).toEqual('da');
                expect(section.dataset.ttsOriginalLang).toBeFalsy();
            }
        );
    });

    it('set preferences', () =>
        Promise.all([getReadAloudClient('readweb', { url: './abc', license: 'foo' }), mockReadwebScript()]).then(
            results => {
                const client = results[0];

                const paramHandler = jest.fn();
                window.vfact_SetCustomParams = paramHandler;

                client.setPreferences({ speed: speeds.slow, pitch: pitches.highest, voice: voices.male });

                expect(paramHandler).toHaveBeenNthCalledWith(1, 5, 'M', void 0, 1);

                client.setPreferences({ speed: 'foo', pitch: '12', voice: 'aVoice' });

                expect(paramHandler).toHaveBeenNthCalledWith(2, 2, 'F', void 0, 2);
            }
        ));

    it('autoscroll during play', () =>
        Promise.all([getReadAloudClient('readweb', { url: './abc', license: 'foo' }), mockReadwebScript()])
            .then(results => {
                const client = results[0];

                client.setPreferences({ autoscroll: true }); // enable autoscroll

                window.vFact_playsection = () => {};

                container.innerHTML = `<p>Some <span id="mark">text</span> to read</p>`;
                const element = container.querySelector('p');

                client.play(element);

                const marker = container.querySelector('#mark');

                marker.scrollIntoView = jest.fn();
                marker.getBoundingClientRect = () => ({ right: -1 }); // fake the element is not in viewport

                // fake the library adds highlighted class
                marker.classList.add('vFact_highlighted');

                return new Promise(resolve => {
                    setTimeout(resolve, 0); // tick
                });
            })
            .then(() => {
                const marker = container.querySelector('#mark');
                expect(marker.scrollIntoView).toHaveBeenCalled();
            }));

    it('autoscroll during selection play', () =>
        Promise.all([getReadAloudClient('readweb', { url: './abc', license: 'foo' }), mockReadwebScript()])
            .then(results => {
                const client = results[0];

                client.setPreferences({ autoscroll: true }); // enable autoscroll

                window.vFact_doplay = () => {};

                container.innerHTML = `<p>Some <span id="mark">text</span> to read</p>`;

                // fake the selected element is the paragraph
                getSelectionAncestor.mockReturnValueOnce(container.querySelector('p'));

                client.playSelection();

                const marker = container.querySelector('#mark');

                marker.scrollIntoView = jest.fn();

                marker.getBoundingClientRect = () => ({ right: -1 }); // fake the element is not in viewport

                // fake the library adds highlighted class
                marker.classList.add('vFact_highlighted');

                return new Promise(resolve => {
                    setTimeout(resolve, 0); // tick
                });
            })
            .then(() => {
                const marker = container.querySelector('#mark');
                expect(marker.scrollIntoView).toHaveBeenCalled();
            }));
});
