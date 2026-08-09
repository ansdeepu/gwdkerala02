// src/lib/numberToWords.ts

export function numberToWordsEnglish(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Rupees Zero Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertTwoDigits(num: number): string {
    if (num < 20) return ones[num];
    const t = Math.floor(num / 10);
    const o = num % 10;
    return tens[t] + (o ? '-' + ones[o] : '');
  }

  function convertThreeDigits(num: number): string {
    const h = Math.floor(num / 100);
    const rest = num % 100;
    let str = '';
    if (h) str += ones[h] + ' Hundred';
    if (rest) str += (str ? ' ' : '') + convertTwoDigits(rest);
    return str;
  }

  let num = Math.floor(Math.abs(amount));
  let result = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  const lakh = Math.floor(num / 100000);
  num %= 100000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  const hundred = num;

  if (crore) result += convertThreeDigits(crore) + ' Crore ';
  if (lakh) result += convertThreeDigits(lakh) + ' Lakh ';
  if (thousand) result += convertThreeDigits(thousand) + ' Thousand ';
  if (hundred) result += convertThreeDigits(hundred);

  result = result.trim();
  return result ? `Rupees ${result} Only` : 'Rupees Zero Only';
}

export function numberToWordsMalayalam(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'പൂജ്യം രൂപ മാത്രം';

  const units: Record<number, string> = {
    0: 'പൂജ്യം', 1: 'ഒന്ന്', 2: 'രണ്ട്', 3: 'മൂന്ന്', 4: 'നാല്',
    5: 'അഞ്ച്', 6: 'ആറ്', 7: 'ഏഴ്', 8: 'എട്ട്', 9: 'ഒൻപത്',
    10: 'പത്ത്', 11: 'പതിനൊന്ന്', 12: 'പന്ത്രണ്ട്', 13: 'പതിമൂന്ന്', 14: 'പതിനാല്',
    15: 'പതിനഞ്ച്', 16: 'പതിനാറ്', 17: 'പതിനേഴ്', 18: 'പതിനെട്ട്', 19: 'പത്തൊൻപത്',
    20: 'ഇരുപത്', 30: 'മുപ്പത്', 40: 'നാൽപ്പത്', 50: 'അമ്പത്',
    60: 'അറുപത്', 70: 'എഴുപത്', 80: 'എൺപത്', 90: 'തൊണ്ണൂറ്', 100: 'നൂറ്'
  };

  function convertUnder100(n: number): string {
    if (n <= 0) return '';
    if (units[n]) return units[n];

    const tens = Math.floor(n / 10) * 10;
    const ones = n % 10;
    const onesStr = units[ones] || '';

    if (tens === 20) return `ഇരുപത്തി${onesStr}`;
    if (tens === 30) return `മുപ്പത്തി${onesStr}`;
    if (tens === 40) return `നാൽപ്പത്തി${onesStr}`;
    if (tens === 50) return `അമ്പത്തി${onesStr}`;
    if (tens === 60) return `അറുപത്തി${onesStr}`;
    if (tens === 70) return `എഴുപത്തി${onesStr}`;
    if (tens === 80) return `എൺപത്തി${onesStr}`;
    if (tens === 90) return `തൊണ്ണൂറ്റി${onesStr}`;

    return String(n);
  }

  let num = Math.floor(Math.abs(amount));
  let parts: string[] = [];

  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  const lakh = Math.floor(num / 100000);
  num %= 100000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  const hundred = Math.floor(num / 100);
  num %= 100;

  if (crore > 0) {
    if (crore === 1) parts.push('ഒരു കോടി');
    else parts.push(`${convertUnder100(crore)} കോടി`);
  }
  if (lakh > 0) {
    if (lakh === 1) parts.push('ഒരു ലക്ഷത്തി');
    else parts.push(`${convertUnder100(lakh)} ലക്ഷത്തി`);
  }
  if (thousand > 0) {
    if (thousand === 1) parts.push('ഒരു ആയിരത്തി');
    else parts.push(`${convertUnder100(thousand)} ആയിരത്തി`);
  }
  if (hundred > 0) {
    const hundredExact = num === 0;
    const hundredMapExact: Record<number, string> = {
      1: 'നൂറ്',
      2: 'ഇരുനൂറ്',
      3: 'മൂന്നൂറ്',
      4: 'നാനൂറ്',
      5: 'അഞ്ഞൂറ്',
      6: 'അറനൂറ്',
      7: 'എഴുന്നൂറ്',
      8: 'എണ്ണൂറ്',
      9: 'തൊള്ളായിരം'
    };
    const hundredMapModifier: Record<number, string> = {
      1: 'നൂറ്റി',
      2: 'ഇരുനൂറ്റി',
      3: 'മൂന്നൂറ്റി',
      4: 'നാനൂറ്റി',
      5: 'അഞ്ഞൂറ്റി',
      6: 'അറനൂറ്റി',
      7: 'എഴുന്നൂറ്റി',
      8: 'എണ്ണൂറ്റി',
      9: 'തൊള്ളായിരത്തി'
    };
    if (hundredExact) {
      parts.push(hundredMapExact[hundred] || `${convertUnder100(hundred)} നൂറ്`);
    } else {
      parts.push(hundredMapModifier[hundred] || `${convertUnder100(hundred)} നൂറ്റി`);
    }
  }
  if (num > 0) {
    parts.push(convertUnder100(num));
  }

  const str = parts.join(' ').replace(/\s+/g, ' ').trim();
  return str ? `${str} രൂപ മാത്രം` : 'പൂജ്യം രൂപ മാത്രം';
}
