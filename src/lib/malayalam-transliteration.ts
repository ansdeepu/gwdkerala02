// Dictionary for common place names, administrative terms, and department designations in Kerala
const DICT_EN_TO_ML: Record<string, string> = {
  // Districts
  'thiruvananthapuram': 'തിരുവനന്തപുരം',
  'trivandrum': 'തിരുവനന്തപുരം',
  'kollam': 'കൊല്ലം',
  'quilon': 'കൊല്ലം',
  'pathanamthitta': 'പത്തനംതിട്ട',
  'alappuzha': 'ആലപ്പുഴ',
  'alleppey': 'ആലപ്പുഴ',
  'kottayam': 'കോട്ടയം',
  'idukki': 'ഇടുക്കി',
  'ernakulam': 'എറണാകുളം',
  'cochin': 'കൊച്ചി',
  'kochi': 'കൊച്ചി',
  'thrissur': 'തൃശ്ശൂർ',
  'trichur': 'തൃശ്ശൂർ',
  'palakkad': 'പാലക്കാട്',
  'palghat': 'പാലക്കാട്',
  'malappuram': 'മലപ്പുറം',
  'kozhikode': 'കോഴിക്കോട്',
  'calicut': 'കോഴിക്കോട്',
  'wayanad': 'വയനാട്',
  'kannur': 'കണ്ണൂർ',
  'cannanore': 'കണ്ണൂർ',
  'kasaragod': 'കാസർഗോഡ്',
  'kasaragode': 'കാസർഗോഡ്',

  // Common Local Self Government Terms
  'grama panchayat': 'ഗ്രാമപഞ്ചായത്ത്',
  'gramapanchayat': 'ഗ്രാമപഞ്ചായത്ത്',
  'panchayat': 'പഞ്ചായത്ത്',
  'panchayath': 'പഞ്ചായത്ത്',
  'block panchayat': 'ബ്ലോക്ക് പഞ്ചായത്ത്',
  'district panchayat': 'ജില്ലാ പഞ്ചായത്ത്',
  'municipality': 'നഗരസഭ',
  'corporation': 'കോർപ്പറേഷൻ',
  'ward': 'വാർഡ്',

  // Designations & Officers
  'district officer': 'ജില്ലാ ഓഫീസർ',
  'executive engineer': 'എക്സിക്യൂട്ടീവ് എഞ്ചിനീയർ',
  'superintending engineer': 'സൂപ്പർഇന്റൻഡിംഗ് എഞ്ചിനീയർ',
  'chief engineer': 'ചീഫ് എഞ്ചിനീയർ',
  'assistant executive engineer': 'അസിസ്റ്റന്റ് എക്സിക്യൂട്ടീവ് എഞ്ചിനീയർ',
  'assistant engineer': 'അസിസ്റ്റന്റ് എഞ്ചിനീയർ',
  'junior engineer': 'ജൂനിയർ എഞ്ചിനീയർ',
  'hydrogeologist': 'ഹൈഡ്രോജിയോളജിസ്റ്റ്',
  'assistant hydrogeologist': 'അസിസ്റ്റന്റ് ഹൈഡ്രോജിയോളജിസ്റ്റ്',
  'geologist': 'ജിയോളജിസ്റ്റ്',
  'secretary': 'സെക്രട്ടറി',
  'president': 'പ്രസിഡന്റ്',
  'chairperson': 'ചെയർപേഴ്സൺ',
  'executive officer': 'എക്സിക്യൂട്ടീവ് ഓഫീസർ',
  'member': 'മെമ്പർ',
  'applicant': 'അപേക്ഷകൻ',
  'convener': 'കൺവീനർ',

  // Government Schemes & Acronyms
  'mla': 'MLA',
  'sdf': 'SDF',
  'mla-sdf': 'MLA - SDF',
  'mla - sdf': 'MLA - SDF',
  'mlasdf': 'MLA - SDF',
  'mplad': 'MPLAD',
  'lsgd': 'LSGD',
  'pwd': 'PWD',
  'gwd': 'GWD',

  // Work & Department Terms
  'ground water department': 'ഭൂജല വകുപ്പ്',
  'groundwater department': 'ഭൂജല വകുപ്പ്',
  'district office': 'ജില്ലാ ഓഫീസ്',
  'borewell': 'കുഴൽകിണർ',
  'bore well': 'കുഴൽകിണർ',
  'tubewell': 'ട്യൂബ് വെൽ',
  'tube well': 'ട്യൂബ് വെൽ',
  'filter point well': 'ഫിൽറ്റർ പൊയിന്റ് വെൽ',
  'borewell construction': 'കുഴൽകിണർ നിർമ്മാണം',
  'tubewell construction': 'ട്യൂബ് വെൽ നിർമ്മാണം',
  'water supply scheme': 'കുടിവെള്ള പദ്ധതി',
  'mini water supply scheme': 'ചെറുകിട കുടിവെള്ള പദ്ധതി',
  'pumping scheme': 'പമ്പിങ് സ്കീം',
  'hand pump': 'ഹാൻഡ് പമ്പ്',
  'hand pump scheme': 'ഹാൻഡ് പമ്പ് സ്കീം',
  'hand pump repair': 'ഹാൻഡ് പമ്പ് റിപ്പയർ',
  'artificial recharge': 'കൃത്രിമ ഭൂജല സംപോഷണം',
  'artificial recharge scheme': 'കൃത്രിമ ഭൂജല സംപോഷണ പദ്ധതി',
  'renovation': 'പുനരുദ്ധാരണം',
  'extension': 'വിപുലീകരണം',
  'construction': 'നിർമ്മാണം',
  'development': 'ഡെവലപ്പിംഗ്',
  'yield': 'ജലലഭ്യത',
  'depth': 'ആഴം',
  'meter': 'മീറ്റർ',
  'meters': 'മീറ്റർ',
  'lph': 'എൽ.പി.എച്ച്',
  'liters': 'ലിറ്റർ',
  'rupees': 'രൂപ',

  // Common places in Kollam / Pathanamthitta / Central Kerala
  'melila': 'മേലില',
  'kalanguvila': 'കലങ്ങുവിള',
  'mukaalil': 'മുകളില്',
  'mukalil': 'മുകളില്',
  'nagar': 'നഗർ',
  'kottarakkara': 'കൊട്ടാരക്കര',
  'punalur': 'പുനലൂർ',
  'karunagappally': 'കരുനാഗപ്പള്ളി',
  'chathannoor': 'ചാത്തന്നൂർ',
  'kundara': 'കുണ്ടറ',
  'kottarakara': 'കൊട്ടാരക്കര',
  'kunnathur': 'കുന്നത്തൂർ',
  'anachal': 'ആനച്ചാൽ',
  'ranni': 'റാന്നി',
  'konni': 'കോന്നി',
  'adoor': 'അടൂർ',
  'mallappally': 'മല്ലപ്പള്ളി',
  'thiruvalla': 'തിരുവല്ല'
};

// Rules for Manglish -> Malayalam Phonetic Transliteration
const VOWELS_INDEPENDENT: [string, string][] = [
  ['aa', 'ആ'], ['A', 'ആ'], ['a', 'അ'],
  ['ee', 'ഈ'], ['ii', 'ഈ'], ['I', 'ഈ'], ['i', 'ഇ'],
  ['oo', 'ഊ'], ['uu', 'ഊ'], ['U', 'ഊ'], ['u', 'ഉ'],
  ['ae', 'ഏ'], ['E', 'ഏ'], ['e', 'എ'],
  ['ai', 'ഐ'],
  ['oa', 'ഓ'], ['O', 'ഓ'], ['o', 'ഒ'],
  ['au', 'ഔ'], ['ou', 'ഔ'],
  ['R', 'ഋ']
];

const VOWEL_SIGNS: [string, string][] = [
  ['aa', 'ാ'], ['A', 'ാ'], ['a', ''],
  ['ee', 'ീ'], ['ii', 'ീ'], ['I', 'ീ'], ['i', 'ി'],
  ['oo', 'ൂ'], ['uu', 'ൂ'], ['U', 'ൂ'], ['u', 'ു'],
  ['ae', 'േ'], ['E', 'േ'], ['e', 'െ'],
  ['ai', 'ൈ'],
  ['oa', 'ോ'], ['O', 'ോ'], ['o', 'ൊ'],
  ['au', 'ൗ'], ['ou', 'ൗ'],
  ['R', 'ൃ']
];

const CONSONANTS: [string, string][] = [
  ['kkh', 'ഖ്'], ['kh', 'ഖ്'], ['k', 'ക്'],
  ['gh', 'ഘ്'], ['g', 'ഗ്'],
  ['ng', 'ങ്'], ['nga', 'ങ്ങ'],
  ['chh', 'ഛ്'], ['ch', 'ച്'],
  ['jh', 'ഝ്'], ['j', 'ജ്'],
  ['nj', 'ഞ്'],
  ['Th', 'ഠ്'], ['T', 'ട്'],
  ['Dh', 'ഢ്'], ['D', 'ഡ്'],
  ['N', 'ണ്'],
  ['thh', 'ഥ്'], ['th', 'ത്'],
  ['dh', 'ധ്'], ['d', 'ദ്'],
  ['nh', 'ന്'], ['n', 'ന്'],
  ['ph', 'ഫ്'], ['f', 'ഫ്'], ['p', 'പ്'],
  ['bh', 'ഭ്'], ['b', 'ബ്'],
  ['m', 'മ്'],
  ['y', 'യ്'],
  ['zh', 'ഴ്'], ['z', 'സ്'],
  ['shh', 'ഷ്'], ['Sh', 'ഷ്'], ['sh', 'ശ്'],
  ['s', 'സ്'],
  ['h', 'ഹ്'],
  ['L', 'ള'], ['l', 'ല്'],
  ['r', 'ര്'], ['R', 'റ്'], ['v', 'വ്'], ['w', 'വ്']
];

// Special conjuncts / double letters common in Manglish
const CONJUNCTS: [string, string][] = [
  ['kku', 'ക്കു'], ['kka', 'ക്ക'], ['kk', 'ക്ക്'],
  ['ngu', 'ങ്ങു'], ['nga', 'ങ്ങ'],
  ['cchu', 'ച്ചു'], ['ccha', 'ച്ച'], ['cch', 'ച്ച്'], ['chhu', 'ച്ഛു'], ['chha', 'ച്ഛ'],
  ['jju', 'ജ്ജു'], ['jja', 'ജ്ജ'],
  ['nju', 'ഞ്ചു'], ['nja', 'ഞ്ച'], ['nj', 'ഞ്ച്'],
  ['ttu', 'ട്ടു'], ['tta', 'ട്ട'], ['tt', 'ട്ട്'],
  ['nnu', 'ന്നു'], ['nna', 'ന്ന'], ['nn', 'ന്ന്'],
  ['nthu', 'ന്തു'], ['ntha', 'ന്ത'], ['nth', 'ന്ത്'],
  ['ndhu', 'ന്ധു'], ['ndha', 'ന്ധ'],
  ['ndu', 'ണ്ടു'], ['nda', 'ണ്ട'], ['nd', 'ണ്ട്'],
  ['ntu', 'ന്റു'], ['nta', 'ന്റ'], ['nt', 'ന്റ്'], ['ntr', 'ന്റ്ര്'],
  ['ttu', 'റ്റു'], ['tta', 'റ്റ'],
  ['ppu', 'പ്പു'], ['ppa', 'പ്പ'], ['pp', 'പ്പ്'],
  ['bbu', 'ബ്ബു'], ['bba', 'ബ്ബ'],
  ['mmu', 'മ്മു'], ['mma', 'മ്മ'], ['mm', 'മ്മ്'],
  ['llu', 'ല്ലു'], ['lla', 'ല്ല'], ['ll', 'ല്ല്'],
  ['llu', 'ള്ളു'], ['lla', 'ള്ള'],
  ['vvu', 'വ്വു'], ['vva', 'വ്വ'],
  ['ssu', 'സ്സു'], ['ssa', 'സ്സ'], ['ss', 'സ്സ്'],
  ['kshu', 'ക്ഷു'], ['ksha', 'ക്ഷ'], ['ksh', 'ക്ഷ്'],
  ['shn', 'ഷ്ണ'], ['st', 'സ്റ്റ്'], ['str', 'സ്ട്ര്'],
  ['rtt', 'ർട്ട്'], ['rth', 'ർത്ത്'], ['rn', 'ർന്ന്'], ['rm', 'ർമ്']
];

// Chillu letters
const CHILLUS: [string, string][] = [
  ['n', 'ൻ'],
  ['r', 'ർ'],
  ['l', 'ൽ'],
  ['L', 'ൾ'],
  ['m', 'ം']
];

/**
 * Phonetic Manglish to Malayalam Transliteration Engine
 * Converts typed Manglish text (e.g., "kollam") into Malayalam script ("കൊല്ലം").
 */
export function transliterateManglish(input: string): string {
  if (!input) return '';

  const words = input.split(/(\s+|[.,/#!$%^&*;:{}=\-_`~()]+)/);
  
  return words.map(word => {
    // Keep whitespace and punctuation as-is
    if (/^\s+$/.test(word) || /^[.,/#!$%^&*;:{}=\-_`~()]+$/.test(word)) {
      return word;
    }

    const lower = word.toLowerCase().trim();
    if (DICT_EN_TO_ML[lower]) {
      return DICT_EN_TO_ML[lower];
    }

    // Process phonetic tokens
    return transliterateWordPhonetic(word);
  }).join('');
}

function transliterateWordPhonetic(word: string): string {
  let res = '';
  let i = 0;
  const len = word.length;

  while (i < len) {
    const remaining = word.slice(i);

    // 1. Check conjuncts first
    let matchedConj = false;
    for (const [pattern, val] of CONJUNCTS) {
      if (remaining.toLowerCase().startsWith(pattern)) {
        res += val;
        i += pattern.length;
        matchedConj = true;
        break;
      }
    }
    if (matchedConj) continue;

    // 2. Check consonants
    let matchedConsonant = false;
    for (const [consPattern, consVal] of CONSONANTS) {
      if (remaining.toLowerCase().startsWith(consPattern)) {
        i += consPattern.length;
        const afterCons = word.slice(i);
        
        // Check vowel following consonant
        let matchedVowel = false;
        for (const [vowPattern, vowVal] of VOWEL_SIGNS) {
          if (vowPattern !== '' && afterCons.toLowerCase().startsWith(vowPattern)) {
            // Remove virama (്) from consonant if present, then add vowel sign
            const baseCons = consVal.replace(/്$/, '');
            res += baseCons + vowVal;
            i += vowPattern.length;
            matchedVowel = true;
            break;
          }
        }

        if (!matchedVowel) {
          // Check if explicit 'a' vowel follow
          if (afterCons.toLowerCase().startsWith('a')) {
            const baseCons = consVal.replace(/്$/, '');
            res += baseCons;
            i += 1;
          } else if (i >= len) {
            // At end of word - apply chillu or virama rule
            const baseCons = consVal.replace(/്$/, '');
            if (consPattern === 'n') res += 'ൻ';
            else if (consPattern === 'r') res += 'ർ';
            else if (consPattern === 'l') res += 'ൽ';
            else if (consPattern === 'L') res += 'ൾ';
            else if (consPattern === 'm') res += 'ം';
            else res += consVal; // keeps virama
          } else {
            res += consVal;
          }
        }

        matchedConsonant = true;
        break;
      }
    }
    if (matchedConsonant) continue;

    // 3. Independent Vowels (at start of word or after another vowel)
    let matchedIndVowel = false;
    for (const [vowPattern, vowVal] of VOWELS_INDEPENDENT) {
      if (remaining.toLowerCase().startsWith(vowPattern)) {
        res += vowVal;
        i += vowPattern.length;
        matchedIndVowel = true;
        break;
      }
    }
    if (matchedIndVowel) continue;

    // Fallback: character as-is
    res += word[i];
    i++;
  }

  return res;
}

/**
 * Intelligent English-to-Malayalam Auto-Translation / Transliteration
 * Translates English text into Malayalam using dictionary lookups & phonetic fallback.
 */
export function translateEnglishToMalayalam(text: string): string {
  if (!text || !text.trim()) return '';

  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Exact dictionary match
  if (DICT_EN_TO_ML[lower]) {
    return DICT_EN_TO_ML[lower];
  }

  // Tokenized translation (handles multi-word strings like "Secretary, Melila Grama Panchayat")
  const tokens = trimmed.split(/(\s+|,|-|\/)/);
  const result = tokens.map(token => {
    const tokenLower = token.toLowerCase();
    if (DICT_EN_TO_ML[tokenLower]) {
      return DICT_EN_TO_ML[tokenLower];
    }
    // Check without trailing punctuation
    const cleanToken = tokenLower.replace(/[^a-z0-9]/g, '');
    if (cleanToken && DICT_EN_TO_ML[cleanToken]) {
      return DICT_EN_TO_ML[cleanToken];
    }
    // Punctuation/whitespace
    if (/^[\s,/-]+$/.test(token)) {
      return token;
    }
    // Transliterate phonetically
    return transliterateManglish(token);
  });

  return result.join('');
}

/**
 * Generates transliteration candidates/suggestions for a given Manglish word.
 * Returns up to 6 smart candidates (e.g. ko -> ['കൊ', 'കോ', ...])
 */
export function getMalayalamSuggestions(word: string): string[] {
  if (!word || !/^[a-zA-Z]+$/.test(word)) return [];
  
  const lower = word.toLowerCase();
  const candidates: string[] = [];
  
  // 1. Precise dictionary match
  if (DICT_EN_TO_ML[lower]) {
    candidates.push(DICT_EN_TO_ML[lower]);
  }
  
  // 2. Default transliteration
  const def = transliterateManglish(word);
  if (def && !candidates.includes(def)) {
    candidates.push(def);
  }
  
  // 3. Generate Smart Vowel Variations
  if (def.endsWith('ൊ')) {
    const swapped = def.slice(0, -1) + 'ോ';
    if (!candidates.includes(swapped)) candidates.push(swapped);
  } else if (def.endsWith('ോ')) {
    const swapped = def.slice(0, -1) + 'ൊ';
    if (!candidates.includes(swapped)) candidates.push(swapped);
  }
  
  if (def.endsWith('െ')) {
    const swapped = def.slice(0, -1) + 'േ';
    if (!candidates.includes(swapped)) candidates.push(swapped);
  } else if (def.endsWith('േ')) {
    const swapped = def.slice(0, -1) + 'െ';
    if (!candidates.includes(swapped)) candidates.push(swapped);
  }

  if (def.endsWith('ി')) {
    const swapped = def.slice(0, -1) + 'ീ';
    if (!candidates.includes(swapped)) candidates.push(swapped);
  } else if (def.endsWith('ീ')) {
    const swapped = def.slice(0, -1) + 'ി';
    if (!candidates.includes(swapped)) candidates.push(swapped);
  }

  if (def.endsWith('ു')) {
    const swapped = def.slice(0, -1) + 'ൂ';
    if (!candidates.includes(swapped)) candidates.push(swapped);
  } else if (def.endsWith('ൂ')) {
    const swapped = def.slice(0, -1) + 'ു';
    if (!candidates.includes(swapped)) candidates.push(swapped);
  }

  // Common consonant swaps (retroflex vs dental, etc.)
  if (def.endsWith('ട')) {
    const swapped = def.slice(0, -1) + 'ത';
    if (!candidates.includes(swapped)) candidates.push(swapped);
    const swapped2 = def.slice(0, -1) + 'റ്റ';
    if (!candidates.includes(swapped2)) candidates.push(swapped2);
  } else if (def.endsWith('ത')) {
    const swapped = def.slice(0, -1) + 'ട';
    if (!candidates.includes(swapped)) candidates.push(swapped);
  } else if (def.endsWith('ട്')) {
    const swapped = def.slice(0, -2) + 'ത്';
    if (!candidates.includes(swapped)) candidates.push(swapped);
    const swapped2 = def.slice(0, -2) + 'റ്റ്';
    if (!candidates.includes(swapped2)) candidates.push(swapped2);
  } else if (def.endsWith('ത്')) {
    const swapped = def.slice(0, -2) + 'ട്';
    if (!candidates.includes(swapped)) candidates.push(swapped);
  }

  if (def.endsWith('ൻ')) {
    const swapped = def.slice(0, -1) + 'ന്';
    if (!candidates.includes(swapped)) candidates.push(swapped);
    const swapped2 = def.slice(0, -1) + 'ന';
    if (!candidates.includes(swapped2)) candidates.push(swapped2);
  } else if (def.endsWith('ന്')) {
    const swapped = def.slice(0, -2) + 'ൻ';
    if (!candidates.includes(swapped)) candidates.push(swapped);
  }

  if (def.endsWith('ർ')) {
    const swapped = def.slice(0, -1) + 'ര്';
    if (!candidates.includes(swapped)) candidates.push(swapped);
    const swapped2 = def.slice(0, -1) + 'ര';
    if (!candidates.includes(swapped2)) candidates.push(swapped2);
  } else if (def.endsWith('ര്')) {
    const swapped = def.slice(0, -2) + 'ർ';
    if (!candidates.includes(swapped)) candidates.push(swapped);
  }

  // 4. Prefix dictionary scans to offer predictive matches
  if (lower.length >= 2) {
    for (const key of Object.keys(DICT_EN_TO_ML)) {
      if (key.startsWith(lower) && key !== lower) {
        const dictVal = DICT_EN_TO_ML[key];
        if (!candidates.includes(dictVal)) {
          candidates.push(dictVal);
        }
      }
      if (candidates.length >= 6) break;
    }
  }

  return candidates.slice(0, 6);
}
