// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023-2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License


import { fireEvent } from '@testing-library/dom';
import getReadAloudClient, { getAvailableProviders } from '../../../../index.js';
import { speeds, voices } from '../../../preferences.js';
import { getOverridenVoices, resetOverridenVoices } from '../voices.js';

jest.mock('../../../util/selection.js', () => ({
    isTextSelected: jest.fn(() => true),
    getSelectionAncestor: jest.fn(() => null)
}));

describe('texthelp provider', () => {
    const container = document.createElement('div');
    container.id = 'fixtures';
    document.body.appendChild(container);

    // config
    const url = 'http://example.com/path/to/speechstream.js';
    const url2 = 'http://example.com/path/to/speechstream2.js';
    const speechstreamConfig = 'ssc';
    const speechstreamConfig2 = 'ssc2';

    const speechstreamApiMock = {
        speechTools: {
            play: jest.fn(),
            stop: jest.fn(),
            speakElement: jest.fn(),
            isSpeaking: jest.fn(),
            isPaused: jest.fn(),
            clickToSpeak: jest.fn(),
            getClickToSpeakState: jest.fn(),
            setContinuousReading: jest.fn(),
            setSpeechStartedCallback: jest.fn(),
            setSpeechStoppedCallback: jest.fn(),
            setVoiceSpeed: jest.fn(),
            setVoice: jest.fn(),
            setUseElementLangTags: jest.fn()
        },
        domControlTools: {
            getNewDomControl: () => ({
                addIgnoreListQuerySelector: jest.fn()
            }),
            setNoScroll: jest.fn()
        }
    };

    beforeAll(() => {
        document.documentElement.lang = 'en';
    });

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

    function mockTexthelpScript() {
        return new Promise(resolve => {
            // for test cases to directly access API - real library also does this
            window.speechstream = speechstreamApiMock;

            // mock the script loading
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

            resolve();
        });
    }

    it('has the provider', () => {
        expect(getAvailableProviders()).toContain('texthelp');
    });

    it('fails to load the provider without a configured URL', () =>
        getReadAloudClient('texthelp', {}).catch(err => {
            expect(err.message).toEqual(`Missing service URL in the configuration 'config.url'`);
        }));

    it('loads the texthelp script', async () => {
        expect(document.querySelectorAll('script[data-tts="texthelp"]')).toHaveLength(0);

        // First load
        return (
            Promise.all([getReadAloudClient('texthelp', { url, speechstreamConfig }), mockTexthelpScript()])
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
                })
                // Tries another load - it should use the cache
                .then(() => getReadAloudClient('texthelp', { url, speechstreamConfig }))
                .then(client => {
                    const script = document.querySelector('script[data-tts="texthelp"]');
                    expect(script.src).toBe(url);
                    expect(script.dataset.speechstreamConfig).toBe(speechstreamConfig);
                    expect(script.dataset.loaded).toBeTruthy();

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
                })
                // Loads another version/config - it should force a reload
                .then(() =>
                    Promise.all([
                        getReadAloudClient('texthelp', { url: url2, speechstreamConfig: speechstreamConfig2 }),
                        mockTexthelpScript()
                    ])
                )
                .then(results => {
                    const script = document.querySelector('script[data-tts="texthelp"]');
                    expect(script.src).toBe(url2);
                    expect(script.dataset.speechstreamConfig).toBe(speechstreamConfig2);
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
                })
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

                client.destroy();
            }
        ));

    it.each([
        ['en', 'female', 'Ava'],
        ['en', 'male', 'Tom'],
        ['en-us', 'female', 'Ava'],
        ['en-US', 'male', 'Tom'],
        ['en-US-alaska', 'male', 'Tom'],
        ['en-GB', 'female', 'Serena'],
        ['en-GB', 'male', 'Daniel'],
        ['fr', 'female', 'Audrey'],
        ['fr-BE', 'female', 'Audrey'],
        ['fr-fr', 'female', 'Audrey'],
        ['fr_CA', 'female', 'Amelie'],
        ['it', 'female', 'Alice'],
        ['it-it', 'male', 'Luca'],
        ['ja', 'female', 'Sakura'],
        ['ja-jp', 'male', 'Ichiro'],
        ['cy-GB', 'female', 'Gwyneth'],
        ['es', 'female', 'Paulina'],
        ['es-ES', 'female', 'Monica'],
        ['es-CO', 'female', 'Soledad'],
        ['xx-YY', 'female', 'Ava']
    ])('sets an appropriate voice for %s %s', (lang, gender, expectedVoice) =>
        Promise.all([getReadAloudClient('texthelp', { url, speechstreamConfig }), mockTexthelpScript()]).then(
            results => {
                const client = results[0];

                client.setPreferences({ voice: gender });

                container.innerHTML = `<p lang="${lang}">Some text to read</p>`;
                const element = container.querySelector('p');

                client.play(element);
                expect(speechstreamApiMock.speechTools.setVoice).toHaveBeenCalledWith(expectedVoice);

                client.destroy();
            }
        )
    );

    it('sets no voice if no lang', () =>
        Promise.all([getReadAloudClient('texthelp', { url, speechstreamConfig }), mockTexthelpScript()]).then(
            results => {
                const client = results[0];
                expect(speechstreamApiMock.speechTools.setVoice).toHaveBeenCalledTimes(1);

                jest.clearAllMocks();

                container.innerHTML = `<p>Some text to read</p>`;
                const element = container.querySelector('p');

                client.play(element);
                expect(speechstreamApiMock.speechTools.setVoice).toHaveBeenCalledTimes(1);

                client.destroy();
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

                client.destroy();
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

                client.destroy();
            }
        ));

    it('pauses, only if playing', () =>
        Promise.all([getReadAloudClient('texthelp', { url, speechstreamConfig }), mockTexthelpScript()]).then(
            results => {
                const client = results[0];

                const pauseHandler = jest.fn();
                window.speechstream.speechTools.pause = pauseHandler;

                speechstreamApiMock.speechTools.isPaused.mockReturnValueOnce(false).mockReturnValueOnce(true);

                client.pause();
                expect(pauseHandler).toHaveBeenCalledTimes(1);

                client.pause();
                expect(pauseHandler).toHaveBeenCalledTimes(1);

                client.destroy();
            }
        ));

    it('resumes, only if paused', () =>
        Promise.all([getReadAloudClient('texthelp', { url, speechstreamConfig }), mockTexthelpScript()]).then(
            results => {
                const client = results[0];

                const resumeHandler = jest.fn();
                window.speechstream.speechTools.pause = resumeHandler; // same call pauses & resumes

                speechstreamApiMock.speechTools.isPaused.mockReturnValueOnce(true).mockReturnValueOnce(false);

                client.resume();
                expect(resumeHandler).toHaveBeenCalledTimes(1);

                client.resume();
                expect(resumeHandler).toHaveBeenCalledTimes(1);

                client.destroy();
            }
        ));

    it('calls reading start/stop handlers', async () => {
        let startHandler;
        let stopHandler;
        let reading = false;

        speechstreamApiMock.speechTools.setSpeechStartedCallback.mockImplementationOnce(
            callback => (startHandler = callback)
        );
        speechstreamApiMock.speechTools.setSpeechStoppedCallback.mockImplementationOnce(
            callback => (stopHandler = callback)
        );

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

                client.destroy();
            }
        );
    });

    it('toggles clickToSpeak', () =>
        Promise.all([getReadAloudClient('texthelp', { url, speechstreamConfig }), mockTexthelpScript()]).then(
            results => {
                const client = results[0];

                speechstreamApiMock.speechTools.getClickToSpeakState
                    .mockReturnValueOnce(true)
                    .mockReturnValueOnce(false);

                client.toggleClickToSpeak();
                expect(speechstreamApiMock.speechTools.clickToSpeak).toHaveBeenCalledTimes(1);
                expect(speechstreamApiMock.speechTools.getClickToSpeakState).toHaveBeenCalledTimes(1);
                expect(speechstreamApiMock.speechTools.setContinuousReading).toHaveBeenLastCalledWith(false);

                client.toggleClickToSpeak();
                expect(speechstreamApiMock.speechTools.clickToSpeak).toHaveBeenCalledTimes(2);
                expect(speechstreamApiMock.speechTools.getClickToSpeakState).toHaveBeenCalledTimes(2);
                expect(speechstreamApiMock.speechTools.setContinuousReading).toHaveBeenLastCalledWith(true);

                client.destroy();
            }
        ));

    it('sets preferences', () =>
        Promise.all([getReadAloudClient('texthelp', { url, speechstreamConfig }), mockTexthelpScript()]).then(
            results => {
                const client = results[0];

                client.setPreferences({ speed: speeds.slow, voice: voices.male, language: 'fr', autoscroll: true });

                expect(speechstreamApiMock.speechTools.setVoiceSpeed).toHaveBeenCalledWith(25);
                expect(speechstreamApiMock.speechTools.setVoice).toHaveBeenLastCalledWith('Thomas');
                expect(speechstreamApiMock.domControlTools.setNoScroll).toHaveBeenCalledWith(false);

                jest.clearAllMocks();

                client.setPreferences({ speed: 'foo', voice: 'aVoice' });

                expect(speechstreamApiMock.speechTools.setVoiceSpeed).not.toHaveBeenCalled();
                expect(speechstreamApiMock.speechTools.setVoice).not.toHaveBeenCalled();
                expect(speechstreamApiMock.domControlTools.setNoScroll).not.toHaveBeenCalled();

                client.destroy();
            }
        ));

    it('sets preferences - voiceMapping', () =>
        Promise.all([getReadAloudClient('texthelp', { url, speechstreamConfig }), mockTexthelpScript()]).then(
            results => {
                const client = results[0];

                const voiceMapping = {
                    female: {
                        en: 'Serena',
                        pt: 'UNKNOWN_WOMAN'
                    },
                    male: {
                        de: 'Hans'
                    }
                };

                client.setPreferences({ voiceMapping });

                expect(getOverridenVoices()).toEqual({
                    female: {
                        en: { name: 'Serena', vendor: 'Nuance', language: 'en-gb' }
                    },
                    male: {
                        de: { name: 'Hans', vendor: 'Polly', language: 'de-DE' }
                    }
                });

                expect(speechstreamApiMock.speechTools.setVoiceSpeed).not.toHaveBeenCalled();
                expect(speechstreamApiMock.speechTools.setVoice).not.toHaveBeenLastCalledWith('Serena'); // initial Ava call still exists
                expect(speechstreamApiMock.domControlTools.setNoScroll).not.toHaveBeenCalled();

                resetOverridenVoices();

                expect(getOverridenVoices()).toEqual({
                    female: {},
                    male: {}
                });

                client.destroy();
            }
        ));

    it('calls setVoice only once if preferences set with disableLangCheck: true', () =>
        Promise.all([getReadAloudClient('texthelp', { url, speechstreamConfig }), mockTexthelpScript()]).then(
            results => {
                const client = results[0];

                client.setPreferences({ disableLangCheck: true, voice: voices.male, language: 'fr' });

                expect(speechstreamApiMock.speechTools.setUseElementLangTags).toHaveBeenCalledWith(false);
                expect(speechstreamApiMock.speechTools.setVoice).toHaveBeenLastCalledWith('Thomas');

                jest.clearAllMocks();

                container.innerHTML = '<p lang="de-DE">Some text to read</p>';
                const element = container.querySelector('p');

                client.play(element);
                client.stop();

                expect(speechstreamApiMock.speechTools.setVoice).not.toHaveBeenCalled();

                window.getSelection = jest.fn(() => ({
                    rangeCount: 1,
                    isCollapsed: false,
                    getRangeAt: () => ({
                        toString: jest.fn(() => 'text')
                    })
                }));

                client.playSelection();
                client.stop();

                expect(speechstreamApiMock.speechTools.setVoice).not.toHaveBeenCalled();

                // Inverse case:

                client.setPreferences({ disableLangCheck: false });

                client.play(element);
                client.stop();

                expect(speechstreamApiMock.speechTools.setVoice).toHaveBeenLastCalledWith('Yannick'); // Hans

                client.destroy();
            }
        ));

    it('replaces documentElement lang temporarily when using disableLangCheck', () =>
        Promise.all([
            getReadAloudClient('texthelp', {
                url,
                speechstreamConfig,
                disableLangCheck: true,
                voiceLanguage: 'fr',
                voiceGender: 'male'
            }),
            mockTexthelpScript()
        ]).then(
            results => {
                const client = results[0];

                expect(speechstreamApiMock.speechTools.setUseElementLangTags).toHaveBeenCalledWith(false);
                expect(speechstreamApiMock.speechTools.setVoice).toHaveBeenLastCalledWith('Thomas');

                jest.clearAllMocks();

                expect(document.documentElement.lang).toBe('fr');

                container.innerHTML = '<p lang="de-DE">Some text to read</p>';
                const element = container.querySelector('p');

                client.play(element);
                client.stop();

                expect(speechstreamApiMock.speechTools.setVoice).not.toHaveBeenCalled();

                client.destroy();

                expect(document.documentElement.lang).toBe('en');
            }
        ));

    it('returns correct set of supported options', () =>
        Promise.all([getReadAloudClient('texthelp', { url, speechstreamConfig }), mockTexthelpScript()]).then(
            results => {
                const client = results[0];

                expect(client.getSupport()).toStrictEqual(
                    {
                        "pitch": {
                            "disabled": true
                        },
                        "speed": {
                            "disabled": false,
                            "options": [
                                "slowest",
                                "normal",
                                "fastest"
                            ]
                        },
                        "voice": {
                            "disabled": false
                        },
                        "clickToSpeak": true
                    }
                );
                client.destroy();
            }
        ));
});
