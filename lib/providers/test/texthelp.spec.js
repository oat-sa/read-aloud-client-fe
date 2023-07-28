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
 * Copyright (c) 2023 (original work) Open Assessment Technologies SA ;
 */

import getReadAloudClient, { getAvailableProviders } from '../../../index.js';
import { fireEvent } from '@testing-library/dom';
import { voices, speeds, pitches } from '../../preferences.js';
import { getSelectionAncestor } from '../../util/selection.js';

jest.mock('../../util/selection.js', () => ({
    isTextSelected: jest.fn(() => true),
    // getSelectionAncestor: jest.fn(() => null)
}));

describe('texthelp provider', () => {
    const container = document.createElement('div');
    container.id = 'fixtures';
    document.body.appendChild(container);

    // config
    const url = 'http://example.com/path/to/speechstream.js';
    const speechstreamConfig = 'ssc';

    const speechstreamApiMock = {
        speechTools: {
            play: jest.fn(),
            stop: jest.fn(),
            speakElement: jest.fn(),
            isSpeaking: jest.fn(),
            setSpeechStartedCallback: jest.fn(),
            setSpeechStoppedCallback: jest.fn(),
            setVoiceSpeed: jest.fn(),
            setVoice: jest.fn(),
        },
        domControlTools: {
            getNewDomControl: () => ({
                addIgnoreListQuerySelector: jest.fn()
            }),
            setNoScroll: jest.fn(),
            setSentenceHighlightStyle: jest.fn(),
        }
    }

    afterEach(() => {
        const texthelpScript = document.querySelector('script[data-tts="texthelp"]');
        if (texthelpScript) {
            texthelpScript.parentNode.removeChild(texthelpScript);
        }
        container.innerHTML = '';
        delete window.speechstream;

        jest.clearAllMocks();
    });
    afterAll(() => {
        document.body.removeChild(container);
    });

    // const texthelpEntrypoint = jest.fn();
    function mockTexthelpScript() {
        const script = document.querySelector('script[data-tts="texthelp"]');
        //mock the script
        // script.onload = jest.fn();
        fireEvent.load(script);
        fireEvent(
            window,
            new CustomEvent('toolbarLoaderLoaded', {
                detail: {
                    Loader: {
                        lateLoad: () => Promise.resolve(speechstreamApiMock)
                    }
                }
            })
        );
        // for test cases to directly access API - real library also does this
        window.speechstream = speechstreamApiMock;
    }

    it('has the provider', () => {
        expect(getAvailableProviders()).toContain('texthelp');
    });

    it('fails to load the provider without a configured URL', () =>
        getReadAloudClient('texthelp', {}).catch(err => {
            expect(err.message).toEqual(`Missing service URL in the configuration 'config.url'`);
        }));

    it('loads the texthelp script', () => {
        expect(document.querySelectorAll('script[data-tts="texthelp"]')).toHaveLength(0);

        return Promise.all([getReadAloudClient('texthelp', { url, speechstreamConfig, }), mockTexthelpScript()])
            .then(results => {
                const script = document.querySelector('script[data-tts="texthelp"]');
                expect(script.src).toBe(url);
                expect(script.dataset.speechstreamConfig).toBe(speechstreamConfig);
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
            }
        );
    });

    it('rejects if texthelp script loading is in timeout', () =>
        getReadAloudClient('texthelp', { url, speechstreamConfig, loadingTimeoutMs: 100 }).catch(err => {
            const script = document.querySelector('script[data-tts="texthelp"]');
            expect(script.dataset.loaded).toBeFalsy();

            expect(err.message).toEqual('Timeout: unable to load the SpeechStream script');
        }));

    it('plays from a dom element', () =>
        Promise.all([getReadAloudClient('texthelp', { url, speechstreamConfig }), mockTexthelpScript()]).then(
            results => {
                const client = results[0];

                const playHandler = jest.fn();
                window.speechstream.speechTools.speakElement = playHandler;

                container.innerHTML = '<p>Some text to read</p>';
                const element = container.querySelector('p');

                client.play(element);
                expect(playHandler).toHaveBeenCalledWith(element, true);
            }
        ));

    it('plays from a selection', () =>
        Promise.all([getReadAloudClient('texthelp', { url, speechstreamConfig }), mockTexthelpScript()]).then(
            results => {
                const client = results[0];

                const playHandler = jest.fn();
                window.speechstream.speechTools.play = playHandler;

                window.getSelection = jest.fn(() => ({
                    rangeCount: 1,
                    isCollapsed: false,
                    getRangeAt: () => ({
                        toString: jest.fn(() => 'text')
                    })
                }));

                client.playSelection();
                expect(playHandler).toHaveBeenCalled();
            }
        ));

    it('stops playing', () =>
        Promise.all([getReadAloudClient('texthelp', { url, speechstreamConfig }), mockTexthelpScript()]).then(
            results => {
                const client = results[0];

                const stopHandler = jest.fn();
                window.speechstream.speechTools.stop = stopHandler;

                client.stop();
                expect(stopHandler).toHaveBeenCalled();
            }
        ));

    it('calls reading start/stop handlers', () => {
        let startHandler;
        let stopHandler;
        let reading = false;

        speechstreamApiMock.speechTools.setSpeechStartedCallback
            .mockImplementationOnce(callback => startHandler = callback);
        speechstreamApiMock.speechTools.setSpeechStoppedCallback
            .mockImplementationOnce(callback => stopHandler = callback);

        speechstreamApiMock.speechTools.isSpeaking.mockImplementation(() => reading);

        return Promise.all([getReadAloudClient('texthelp', { url, speechstreamConfig }), mockTexthelpScript()]).then(
            results => {
                const client = results[0];

                window.speechstream.speechTools.play.mockImplementationOnce(() => {
                    reading = true;
                    startHandler();
                });
                window.speechstream.speechTools.stop.mockImplementationOnce(() => {
                    reading = false;
                    stopHandler();
                });

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

    /********/

    it.skip('ignore configured elements', () =>
        Promise.all([getReadAloudClient('texthelp', { url, speechstreamConfig }), mockTexthelpScript()]).then(
            results => {
                const client = results[0];

                container.innerHTML = '<p>Some text to <span class="ignore-me">ignore</span> read</p>';

                expect(container.querySelectorAll('.vFact_DoNotReadAloud')).toHaveLength(0);

                client.ignoreElements('.ignore-me');
                client.play(container);

                expect(container.querySelectorAll('.vFact_DoNotReadAloud')).toHaveLength(1);
            }
        ));

    it.todo('swap and restore the lang attribute'); // see readweb?

    it.todo('maps the lang attribute'); // see readweb?

    it.skip('set preferences', () =>
        Promise.all([getReadAloudClient('texthelp', { url, speechstreamConfig }), mockTexthelpScript()]).then(
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

    it.skip('autoscroll during play', () => {
        const html = document.querySelector('html');
        return Promise.all([getReadAloudClient('texthelp', { url, speechstreamConfig }), mockTexthelpScript()])
            .then(results => {
                const client = results[0];

                client.setPreferences({ autoscroll: true }); // enable autoscroll

                window.vFact_playsection = () => {};

                container.innerHTML = `<p>Some <span id="mark">text</span> to read</p>`;
                const element = container.querySelector('p');

                client.play(element);

                html.scroll = jest.fn();

                const marker = container.querySelector('#mark');

                marker.getBoundingClientRect = () => ({ top: -1 }); // fake the element is not in viewport

                // fake the library adds highlighted class
                marker.classList.add('vFact_highlighted');

                return new Promise(resolve => {
                    setTimeout(resolve, 0); // tick
                });
            })
            .then(() => {
                expect(html.scroll).toHaveBeenCalled();
            });
    });

    it.skip('autoscroll during selection play', () => {
        const html = document.querySelector('html');
        return Promise.all([getReadAloudClient('texthelp', { url, speechstreamConfig }), mockTexthelpScript()])
            .then(results => {
                const client = results[0];

                client.setPreferences({ autoscroll: true }); // enable autoscroll

                window.vFact_doplay = () => {};

                container.innerHTML = `<p>Some <span id="mark">text</span> to read</p>`;

                // fake the selected element is the paragraph
                getSelectionAncestor.mockReturnValueOnce(container.querySelector('p'));

                client.playSelection();

                html.scroll = jest.fn();

                const marker = container.querySelector('#mark');

                marker.scrollIntoView = jest.fn();

                marker.getBoundingClientRect = () => ({ top: -1 }); // fake the element is not in viewport

                // fake the library adds highlighted class
                marker.classList.add('vFact_highlighted');

                return new Promise(resolve => {
                    setTimeout(resolve, 0); // tick
                });
            })
            .then(() => {
                expect(html.scroll).toHaveBeenCalled();
            });
    });
});
