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
 * Copyright (c) 2021 (original work) Open Assessment Technologies SA ;
 */
import getReadAloudClient, { getAvailableProviders } from '../../../index.js';

describe('native provider', () => {
    const container = document.createElement('div');
    container.id = 'fixtures';
    document.body.appendChild(container);

    afterEach(() => {
        container.innerHTML = '';
        jest.clearAllMocks();
        delete window.speechSynthesis;
        delete window.SpeechSynthesisUtterance;
        delete window.getSelection;
    });
    afterAll(() => {
        document.body.removeChild(container);
    });

    function mockSpeechSynthesis() {
        let voices = [];
        window.speechSynthesis = {
            getVoices() {
                if (voices.length) {
                    return voices;
                }
                voices = [
                    { name: 'v1', lang: 'en' },
                    { name: 'v2', lang: 'de' }
                ];
                if (typeof this.onvoiceschanged === 'function') {
                    this.onvoiceschanged();
                }
            }
        };
    }

    it('has the provider', () => {
        expect(getAvailableProviders()).toContain('native');
    });

    it('fails to load the provider if speechSynthesis is not available', () =>
        getReadAloudClient('native').catch(err => {
            expect(err.message).toEqual(`No speech synthesis system found for your setup.`);
        }));

    it('loads the provider', () => {
        mockSpeechSynthesis();
        return getReadAloudClient('native').then(client => {
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
        });
    });

    it('rejects if no voices are available', () => {
        let changed = false;
        let voiceschanged;
        window.speechSynthesis = {
            getVoices() {
                if (!changed) {
                    changed = true;
                    if (typeof this.onvoiceschanged === 'function') {
                        this.onvoiceschanged();
                    }
                }
                return [];
            }
        };
        return getReadAloudClient('native').catch(err => {
            expect(err.message).toEqual('No voice found for the speech system.');
        });
    });

    it('plays from a dom element', () => {
        mockSpeechSynthesis();
        const utteranceInstance = {};
        const utteranceMock = jest.fn(text => {
            utteranceInstance.text = text;
            return utteranceInstance;
        });
        window.SpeechSynthesisUtterance = utteranceMock;
        const speakHandler = jest.fn();
        window.speechSynthesis.speak = speakHandler;

        return getReadAloudClient('native').then(client => {
            container.innerHTML = '<p>Some text to read</p>';
            const element = container.querySelector('p');
            element.innerText = 'Some text to read'; //jsdom doesnot support innerText

            client.play(element);

            expect(utteranceMock).toHaveBeenCalledWith('Some text to read');
            expect(utteranceInstance.text).toEqual('Some text to read');
            expect(speakHandler).toHaveBeenCalledWith(expect.objectContaining({ text: 'Some text to read' }));
        });
    });

    it('plays from a selection', () => {
        mockSpeechSynthesis();
        const utteranceInstance = {};
        const utteranceMock = jest.fn(text => {
            utteranceInstance.text = text;
            return utteranceInstance;
        });
        window.SpeechSynthesisUtterance = utteranceMock;
        const speakHandler = jest.fn();
        window.speechSynthesis.speak = speakHandler;

        const selectionHandler = jest.fn(() => 'selected text to read');

        window.getSelection = jest.fn(() => ({
            rangeCount: 1,
            isCollapsed: false,
            getRangeAt: jest.fn(() => ({
                commonAncestorContainer: container,
                toString: selectionHandler
            })),
            toString: selectionHandler
        }));

        return getReadAloudClient('native').then(client => {
            client.playSelection();

            expect(utteranceMock).toHaveBeenCalledWith('selected text to read');
            expect(utteranceInstance.text).toEqual('selected text to read');
            expect(speakHandler).toHaveBeenCalledWith(expect.objectContaining({ text: 'selected text to read' }));
        });
    });

    it('stops reading', () => {
        mockSpeechSynthesis();
        const utteranceInstance = {};
        const utteranceMock = jest.fn(text => {
            utteranceInstance.text = text;
            return utteranceInstance;
        });
        window.SpeechSynthesisUtterance = utteranceMock;
        const speakHandler = jest.fn();
        window.speechSynthesis.speak = speakHandler;
        const cancleHandler = jest.fn();
        window.speechSynthesis.cancel = cancleHandler;

        return getReadAloudClient('native').then(client => {
            container.innerHTML = '<p>Some text to read</p>';
            const element = container.querySelector('p');
            element.innerText = 'Some text to read'; //jsdom doesnot support innerText

            client.play(element);

            expect(utteranceMock).toHaveBeenCalledWith('Some text to read');
            expect(utteranceInstance.text).toEqual('Some text to read');
            expect(speakHandler).toHaveBeenCalledWith(expect.objectContaining({ text: 'Some text to read' }));

            client.stop();

            expect(cancleHandler).toHaveBeenCalled();
        });
    });

    it('set preferences', () => {
        mockSpeechSynthesis();
        const utteranceInstance = {};
        const utteranceMock = jest.fn(text => {
            utteranceInstance.text = text;
            return utteranceInstance;
        });
        window.SpeechSynthesisUtterance = utteranceMock;
        const speakHandler = jest.fn();
        window.speechSynthesis.speak = speakHandler;

        return getReadAloudClient('native').then(client => {
            container.innerHTML = '<p>Some text to read</p>';
            const element = container.querySelector('p');
            element.innerText = 'Some text to read'; //jsdom doesnot support innerText

            client.setPreferences({ speed: 'fast', pitch: 'low', volume: 'normal', voice: 'v1' });
            client.play(element);

            expect(utteranceMock).toHaveBeenCalledWith('Some text to read');
            expect(utteranceInstance.text).toEqual('Some text to read');
            expect(speakHandler).toHaveBeenCalledWith(
                expect.objectContaining({ text: 'Some text to read', volume: 0.5, rate: 2, pitch: 0.5 })
            );
        });
    });
});
