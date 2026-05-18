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
 * Copyright (c) 2023-2024 (original work) Open Assessment Technologies SA ;
 */
import { normalize, getLanguagePart } from '../../util/locale.js';

// SpeechStream uses person names: each voice is tailored to a particular language (and sometimes region).
// Their support of locale codes is inconsistent (sometimes 'fr', sometimes 'it-it').
// So instead of letting SS auto-choose a voice based on lang, we map to our desired voices here.
// It's not mandatory to fill every locale, because SS will still provide a reasonable fallback for most missing cases.
//
// Unless indicated by a comment, the voice provider SS uses is 'Nuance' (their default provider, and standard billing).
// Voices from AWS Polly require `speechSettings.enablePollyVoices: true` to be set in the remote config (and are billed separately).
// Voices from Cereproc require `speechSettings.enableCereprocVoices: true` to be set in the remote config (and are billed separately).
//
// prettier-ignore
export const languageToVoiceByGender = {
    female: {
        'ar': 'Zeina', // AWS Polly voice
        'ca': 'Montserrat',
        'cy': 'Gwyneth', // AWS Polly voice
        'da': 'Sara',
        'de': 'Anna',
        'el': 'Melina',
        'en': 'Ava',
        'en-au': 'Karen',
        'en-gb': 'Serena',
        'es': 'Paulina',
        'es-co': 'Soledad',
        'es-es': 'Monica',
        'es-es-x-castilla': 'Conchita',
        'es-mx': 'Penelope', // AWS Polly voice
        'es-us': 'Lupe', // AWS Polly voice
        'fr': 'Audrey',
        'fr-ca': 'Amelie',
        'hu': 'Mariska',
        'is': 'Dora', // AWS Polly voice
        'it': 'Alice',
        'ja': 'Sakura',
        'lt': 'Egle', // Cereproc voice
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
        'tr': 'Yelda',
        'uk': 'Lesya',
        'val': 'Montserrat', // mapped to Catalan
        'zh': 'Tian-Tian',
        'zh-tw': 'Mei-Jia',
    },
    male: {
        'ar': 'Tarik',
        'ca': 'Jordi',
        'cy': 'Geraint', // AWS Polly voice
        'da': 'Magnus',
        'de': 'Yannick',
        'el': 'Nikos',
        'en': 'Tom',
        'en-au': 'Lee',
        'en-gb': 'Daniel',
        'es': 'Juan',
        'es-co': 'Carlos',
        'es-es': 'Jorge',
        'es-es-x-castilla': 'Enrique',
        'es-mx': 'Juan',
        'es-us': 'Miguel', // AWS Polly voice
        'fr': 'Thomas',
        'hu': 'Mariska', // not male
        'is': 'Karl', // AWS Polly voice
        'it': 'Luca',
        'ja': 'Ichiro',
        'lt': 'Egle', // Cereproc voice; not male
        'nl': 'Xander',
        'nb': 'Henrik',
        'nn': 'Henrik',
        'no': 'Henrik',
        'pl': 'Ewa', // not male
        'pt': 'Cristiano',
        'pt-br': 'Felipe',
        'ro': 'Ioana', // not male
        'ru': 'Yuri',
        'sv': 'Oskar',
        'tr': 'Cem',
        'uk': 'Lesya', // not male
        'val': 'Jordi', // mapped to Catalan
        'zh': 'Tian-Tian', // not male
        'zh-tw': 'Mei-Jia', // not male
    }
};

// This one stores all the usable alternative voice names per gender and language prefix
// prettier-ignore
export const languageToAltVoicesByGender = {
    female: {
        // First array element should be the default voice
        'da': ['Sara', 'Naja'], // OK:
        'de': ['Anna', 'Vicky', 'Petra', 'Marlene'], // OK:
        'en': ['Ava', 'Karen', 'Serena', 'Amy', 'Nicole', 'Kendra', 'Kimberly', 'Aditi'], // OK:
        'es': ['Paulina', 'Soledad', 'Monica', 'Conchita', 'Penelope', 'Lupe'], // OK: no Mia
        'fr': ['Audrey', 'Amelie', 'Chantal', 'Celine', 'Lea', 'Gabrielle'], // OK:
        'it': ['Bianca', 'Carla', 'Alice', 'Federica'], // OK:
        'ja': ['Mizuki', 'Sakura'], // OK: Mizuki way better
        'nb': ['Nora', 'Liv'], // OK: virtually equal
        'nl': ['Claire', 'Ellen', 'Lotte', 'Paola'], // OK:
        'nn': ['Nora'],
        'no': ['Nora'],
        'pl': ['Ewa', 'Zosia', 'Maja'], // OK:
        'pt': ['Joana', 'Luciana', 'Vitoria', 'Camila', 'Catarina'], // OK:
        'ro': ['Carmen', 'Ioana'], // OK: Ioana more robotic
        'sv': ['Alva', 'Astrid'] // OK:
    },
    male: {
        'da': ['Mads', 'Magnus'], // OK:
        'de': ['Hans', 'Yannick'], // OK:
        'en': ['Tom', 'Lee', 'Brian', 'Russell', 'Matthew'], // OK:
        'es': ['Juan', 'Carlos', 'Jorge', 'Enrique', 'Miguel'], // OK:
        'fr': ['Thomas', 'Mathieu'], // OK: Thomas superior
        'it': ['Luca', 'Giorgio'], // OK:
        'ja': ['Takumi', 'Ichiro'], // OK:
        'nb': ['Henrik', 'Isak_nb', 'Inger_nb'], // KO: only Henrik worth using
        'nl': ['Xander', 'Ruben'], // OK:
        'nn': ['Henrik', 'Isak_no', 'Inger_no'], // KO: only Henrik
        'no': ['Henrik', 'Isak_no', 'Inger_no'], // KO: only Henrik
        'pl': ['Jacek', 'Jan'], // OK:
        'pt': ['Cristiano', 'Felipe', 'Ricardo'] // OK:
    }
};

/**
 * Module-scoped storage for overrides set through provider API
 */
const languageToVoiceByGenderOverrides = { female: {}, male: {} };

export function updateLanguageToVoiceByGenderOverrides(gender, locale, voice) {
    if (!gender || !locale || !voice) return;

    languageToVoiceByGenderOverrides[gender][locale] = voice;
    console.log('updateLanguageToVoiceByGenderOverrides', [gender, locale, voice]);
}

export function resetLanguageToVoiceByGenderOverrides(gender, locale) {
    if (gender && locale && locale in languageToVoiceByGenderOverrides[gender]) {
        languageToVoiceByGenderOverrides[gender][locale] = languageToVoiceByGender[gender][locale];
        return;
    }
    if (gender && !locale) {
        languageToVoiceByGenderOverrides[gender] = {};
        return;
    }
    // without either parameter, full reset
    languageToVoiceByGenderOverrides.female = {};
    languageToVoiceByGenderOverrides.male = {};
}

function getLanguageToVoiceByGenderWithOverrides() {
    return {
        female: {
            ...languageToVoiceByGender.female,
            ...languageToVoiceByGenderOverrides.female
        },
        male: {
            ...languageToVoiceByGender.male,
            ...languageToVoiceByGenderOverrides.male
        }
    };
}

/**
 * Look up a voice name from the mapping
 * We have this because it gives more control over genders and fallback lookups, than SpeechStream's setLanguageVoiceMapping()
 * @param {string} gender
 * @param {string} lang
 * @returns {string} voice name
 */
export function lookupVoice(gender = 'female', lang = 'en') {
    const lowerLangValue = normalize(lang)?.toLowerCase() || '';
    const lowerLangPrefix = getLanguagePart(lowerLangValue);
    console.log('detected:', lowerLangValue, '/', lowerLangPrefix);

    // const langVoiceMapByGender = getLanguageToVoiceByGenderWithOverrides();

    const langVoiceMapOverrides = languageToVoiceByGenderOverrides[gender];
    const langVoiceMap = languageToVoiceByGender[gender];

    // first, overrides
    if (lowerLangPrefix && lowerLangPrefix in langVoiceMapOverrides) {
        console.log('overridden voice:', langVoiceMapOverrides[lowerLangPrefix]);
        return langVoiceMapOverrides[lowerLangPrefix];
    }
    // second, defaults
    if (lowerLangValue && lowerLangValue in langVoiceMap) {
        console.log('default voice for', lowerLangValue, ':', langVoiceMap[lowerLangValue]);
        return langVoiceMap[lowerLangValue];
    } else if (lowerLangPrefix && lowerLangPrefix in langVoiceMap) {
        console.log('default voice for', lowerLangPrefix, ':', langVoiceMap[lowerLangPrefix]);
        return langVoiceMap[lowerLangPrefix];
    }

    return langVoiceMap['en'];
}

/**
 * Look up the alternative voices from the mapping
 * @param {string} gender
 * @param {string} lang
 * @returns {string[]} voice names
 */
export function lookupAltVoices(gender = 'female', lang = 'en') {
    const langVoiceMapByGender = languageToAltVoicesByGender;

    const langVoiceMap = langVoiceMapByGender[gender];

    const lowerLangValue = normalize(lang)?.toLowerCase() || '';
    const lowerLangPrefix = getLanguagePart(lowerLangValue);

    // only lang prefixes are supported
    if (lowerLangPrefix && lowerLangPrefix in langVoiceMap) {
        return langVoiceMap[lowerLangPrefix];
    }
    return langVoiceMap['en'];
}