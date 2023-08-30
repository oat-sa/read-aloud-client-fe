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
import { normalize, getLanguagePart } from '../../util/locale.js';

// SpeechStream uses person names: each voice is tailored to a particular language (and sometimes region).
// Their support of locale codes is inconsistent (sometimes 'fr', sometimes 'it-it').
// So instead of letting SS auto-choose a voice based on lang, we map to our desired voices here.
export const languageToVoiceByGender = {
    female: {
        'ar': 'Tarik', // not female
        'da': 'Sara',
        'de': 'Anna',
        'en': 'Ava',
        'en-au': 'Karen',
        'en-gb': 'Serena',
        'es': 'Monica',
        'es-mx': 'Paulina',
        'es-us': 'Paulina',
        'fr': 'Audrey',
        'fr-ca': 'Amelie',
        'hu': 'Mariska',
        'it': 'Alice',
        'ja': 'Sakura',
        'nl': 'Claire',
        'nl-be': 'Ellen',
        'nb': 'Nora',
        'nn': 'Nora',
        'no': 'Nora',
        'pl': 'Ewa',
        'pt': 'Joana',
        'pt-br': 'Luciana',
        'ro': 'Ioana',
        'ru': 'Milena',
        'sv': 'Alva',
        'uk': 'Lesya',
    },
    male: {
        // Note: langs wth no male voice or no regional variant could be improved by asking to enable the 'Polly' provider
        'ar': 'Tarik',
        'da': 'Magnus',
        'de': 'Yannick',
        'en': 'Tom',
        'en-au': 'Lee',
        'en-gb': 'Daniel',
        'es': 'Jorge',
        'es-mx': 'Juan',
        'es-us': 'Juan',
        'fr': 'Thomas',
        'hu': 'Mariska', // not male
        'it': 'Luca',
        'ja': 'Ichiro',
        'nl': 'Xander',
        'nb': 'Henrik',
        'nn': 'Henrik',
        'no': 'Henrik',
        'pl': 'Ewa', // not male
        'pt': 'Felipe',
        'ro': 'Ioana', // not male
        'ru': 'Yuri',
        'sv': 'Oskar',
        'uk': 'Lesya', // not male
    }
};

/**
 * Look up a voice name from the mapping
 * @param {string} gender
 * @param {string} lang
 * @returns {string} voice name
 */
export function lookupVoice(gender = 'female', lang = 'en') {
    const langVoiceMap = languageToVoiceByGender[gender];

    const lowerLangValue = normalize(lang).toLowerCase();
    const lowerLangPrefix = getLanguagePart(lowerLangValue);

    if (lowerLangValue && lowerLangValue in langVoiceMap) {
        return langVoiceMap[lowerLangValue];
    } else if (lowerLangPrefix && lowerLangPrefix in langVoiceMap) {
        return langVoiceMap[lowerLangPrefix];
    }
    return langVoiceMap['en'];
}
