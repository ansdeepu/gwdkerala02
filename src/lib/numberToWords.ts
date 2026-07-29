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

  let num = Math.floor(Math.abs(amount));

  // Simple phonetic builder for Indian numbering format in Malayalam
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
    parts.push(`${crore > 1 ? units[crore] || crore : 'ഒരു'} കോടി`);
  }
  if (lakh > 0) {
    if (lakh === 1) parts.push('ഒരു ലക്ഷത്തി');
    else if (lakh === 2) parts.push('രണ്ട് ലക്ഷത്തി');
    else parts.push(`${units[lakh] || lakh} ലക്ഷത്തി`);
  }
  if (thousand > 0) {
    if (thousand === 1) parts.push('ഒരു ആയിരത്തി');
    else if (thousand === 20) parts.push('ഇരുപതിനായിരത്തി');
    else parts.push(`${units[thousand] || thousand} ആയിരത്തി`);
  }
  if (hundred > 0) {
    if (hundred === 1) parts.push('ഇരുനൂറ്റി'); // e.g. 100 or 200 modifier
    else if (hundred === 2) parts.push('ഇരുനൂറ്റി');
    else parts.push(`${units[hundred] || hundred} നൂറ്റി`);
  }
  if (num > 0) {
    if (units[num]) {
      parts.push(units[num]);
    } else {
      const tens = Math.floor(num / 10) * 10;
      const ones = num % 10;
      if (tens === 20) parts.push(`ഇരുപത്തി${units[ones] || ones}`);
      else if (tens === 30) parts.push(`മുപ്പത്തി${units[ones] || ones}`);
      else if (tens === 40) parts.push(`നാൽപ്പത്തി${units[ones] || ones}`);
      else if (tens === 50) parts.push(`അമ്പത്തി${units[ones] || ones}`);
      else if (tens === 60) parts.push(`അറുപത്തി${units[ones] || ones}`);
      else if (tens === 70) parts.push(`എഴുപത്തി${units[ones] || ones}`);
      else if (tens === 80) parts.push(`എൺപത്തി${units[ones] || ones}`);
      else if (tens === 90) parts.push(`തൊണ്ണൂറ്റി${units[ones] || ones}`);
      else parts.push(String(num));
    }
  }

  const str = parts.join(' ').replace(/\s+/g, ' ').trim();
  return str ? `${str} രൂപ മാത്രം` : 'പൂജ്യം രൂപ മാത്രം';
}
