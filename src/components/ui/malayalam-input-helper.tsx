'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Keyboard, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  transliterateManglish,
  translateEnglishToMalayalam,
  getMalayalamSuggestions,
} from '@/lib/malayalam-transliteration';

// Malayalam Keyboard Character Groups
const MALAYALAM_KEYPAD = {
  vowels: ['അ', 'ആ', 'ഇ', 'ഈ', 'ഉ', 'ഊ', 'ഋ', 'എ', 'ഏ', 'ഐ', 'ഒ', 'ഓ', 'ഔ'],
  signs: ['ാ', 'ി', 'ീ', 'ു', 'ൂ', 'ൃ', 'െ', 'േ', 'ൈ', 'ൊ', 'ോ', 'ൗ', '്', 'ം', 'ഃ'],
  chillus: ['ൻ', 'ർ', 'ൽ', 'ൾ', 'ക്', 'മ്പ', 'ന്റ', 'ണ്ട', 'ഞ്ച', 'ന്ന', 'മ്മ', 'ക്ക', 'പ്പ', 'റ്റ', 'ട്ട'],
  consonants1: ['ക', 'ഖ', 'ഗ', 'ഘ', 'ങ', 'ച', 'ഛ', 'ജ', 'ഝ', 'ഞ', 'ട', 'ഠ', 'ഡ', 'ഢ', 'ണ'],
  consonants2: ['ത', 'ഥ', 'ദ', 'ധ', 'ന', 'പ', 'ഫ', 'ബ', 'ഭ', 'മ', 'യ', 'ര', 'ല', 'വ', 'ശ'],
  consonants3: ['ഷ', 'സ', 'ഹ', 'ള', 'ഴ', 'റ'],
  quickWords: [
    'ഗ്രാമപഞ്ചായത്ത്',
    'സെക്രട്ടറി',
    'കുഴൽകിണർ',
    'ട്യൂബ് വെൽ',
    'കുടിവെള്ള പദ്ധതി',
    'ജില്ലാ ഓഫീസർ',
    'അസിസ്റ്റന്റ് എഞ്ചിനീയർ',
    'പഞ്ചായത്ത്',
    'കൊല്ലം',
    'പത്തനംതിട്ട',
    'തിരുവനന്തപുരം',
    'കോട്ടയം',
    'ആലപ്പുഴ',
  ],
};

interface MalayalamKeyboardPopoverProps {
  onInsertCharacter: (char: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MalayalamKeyboardPopover: React.FC<MalayalamKeyboardPopoverProps> = ({
  onInsertCharacter,
  isOpen,
  onOpenChange,
}) => {
  const [activeTab, setActiveTab] = useState<'vowels' | 'consonants' | 'signs' | 'quick'>('vowels');

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 focus-visible:ring-emerald-400 focus-visible:ring-offset-0"
          title="Open Malayalam Virtual Keypad"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] sm:w-[380px] p-3 shadow-xl border-emerald-200 dark:border-emerald-800 z-50" align="end">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <Keyboard className="h-4 w-4" />
            <span>മലയാളം അക്ഷരമാല (Virtual Keyboard)</span>
          </div>
          <span className="text-[10px] text-gray-500">ക്ലിക്ക് ചെയ്ത് ടൈപ്പ് ചെയ്യാം</span>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 mb-2.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-md text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab('vowels')}
            className={`flex-1 py-1 rounded transition-colors ${
              activeTab === 'vowels'
                ? 'bg-white dark:bg-gray-700 font-bold text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            സ്വരാക്ഷരങ്ങൾ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('consonants')}
            className={`flex-1 py-1 rounded transition-colors ${
              activeTab === 'consonants'
                ? 'bg-white dark:bg-gray-700 font-bold text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            വ്യഞ്ജനാക്ഷരങ്ങൾ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signs')}
            className={`flex-1 py-1 rounded transition-colors ${
              activeTab === 'signs'
                ? 'bg-white dark:bg-gray-700 font-bold text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            ചിഹ്നങ്ങൾ/ചില്ല്
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-1 rounded transition-colors ${
              activeTab === 'quick'
                ? 'bg-white dark:bg-gray-700 font-bold text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            വാക്കുകൾ
          </button>
        </div>

        {/* Keyboard Keys Grid */}
        <div className="max-h-[190px] overflow-y-auto pr-1">
          {activeTab === 'vowels' && (
            <div className="grid grid-cols-6 gap-1.5">
              {MALAYALAM_KEYPAD.vowels.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => onInsertCharacter(char)}
                  className="h-9 text-base border border-gray-200 dark:border-gray-700 rounded hover:bg-emerald-100 hover:border-emerald-400 dark:hover:bg-emerald-900/40 text-gray-800 dark:text-gray-100 font-medium active:scale-95 transition-transform"
                >
                  {char}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'consonants' && (
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-1.5">
                {MALAYALAM_KEYPAD.consonants1.map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => onInsertCharacter(char)}
                    className="h-8 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-emerald-100 hover:border-emerald-400 dark:hover:bg-emerald-900/40 text-gray-800 dark:text-gray-100 active:scale-95 transition-transform"
                  >
                    {char}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {MALAYALAM_KEYPAD.consonants2.map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => onInsertCharacter(char)}
                    className="h-8 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-emerald-100 hover:border-emerald-400 dark:hover:bg-emerald-900/40 text-gray-800 dark:text-gray-100 active:scale-95 transition-transform"
                  >
                    {char}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {MALAYALAM_KEYPAD.consonants3.map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => onInsertCharacter(char)}
                    className="h-8 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-emerald-100 hover:border-emerald-400 dark:hover:bg-emerald-900/40 text-gray-800 dark:text-gray-100 active:scale-95 transition-transform"
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'signs' && (
            <div className="space-y-2">
              <div className="text-[10px] text-gray-500 font-medium">സ്വരാക്ഷര ചിഹ്നങ്ങൾ:</div>
              <div className="grid grid-cols-5 gap-1.5">
                {MALAYALAM_KEYPAD.signs.map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => onInsertCharacter(char)}
                    className="h-8 text-sm border border-emerald-100 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900 rounded hover:bg-emerald-100 hover:border-emerald-400 text-emerald-950 dark:text-emerald-200 font-bold active:scale-95 transition-transform"
                  >
                    {char}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-gray-500 font-medium pt-1">ചില്ല് & കൂട്ടക്ഷരങ്ങൾ:</div>
              <div className="grid grid-cols-5 gap-1.5">
                {MALAYALAM_KEYPAD.chillus.map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => onInsertCharacter(char)}
                    className="h-8 text-xs border border-gray-200 dark:border-gray-700 rounded hover:bg-emerald-100 text-gray-800 dark:text-gray-100 active:scale-95 transition-transform"
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'quick' && (
            <div className="flex flex-wrap gap-1.5">
              {MALAYALAM_KEYPAD.quickWords.map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => onInsertCharacter(word + ' ')}
                  className="px-2 py-1 text-xs border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-full hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-medium active:scale-95 transition-transform"
                >
                  {word}
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export interface MalayalamInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  englishValue?: string;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  className?: string;
  showAutoTranslateButton?: boolean;
}

export const MalayalamInput: React.FC<MalayalamInputProps> = ({
  value = '',
  onChange,
  englishValue,
  multiline = false,
  rows = 3,
  placeholder,
  className = '',
  showAutoTranslateButton = false,
  disabled,
  ...props
}) => {
  const [keypadOpen, setKeypadOpen] = useState<boolean>(false);
  const [activeWord, setActiveWord] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const lastConversionRef = useRef<{ mlWithSpace: string; engWord: string } | null>(null);

  // Checks and updates suggestions based on word under cursor
  const checkCursorAndSuggestions = useCallback(() => {
    const el = inputRef.current;
    if (!el || disabled) return;
    const cursor = el.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursor);
    const match = textBeforeCursor.match(/([a-zA-Z]+)$/);
    if (match) {
      const word = match[1];
      setActiveWord(word);
      setSuggestions(getMalayalamSuggestions(word));
    } else {
      setActiveWord('');
      setSuggestions([]);
    }
  }, [value, disabled]);

  // Run on value change if input is active
  useEffect(() => {
    if (document.activeElement === inputRef.current) {
      checkCursorAndSuggestions();
    }
  }, [value, checkCursorAndSuggestions]);

  // Insert selected candidate replacing English word
  const selectSuggestion = (suggestion: string) => {
    const el = inputRef.current;
    if (!el) return;
    const cursor = el.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursor);
    const match = textBeforeCursor.match(/([a-zA-Z]+)$/);
    if (!match) return;

    const engWord = match[1];
    const prefix = textBeforeCursor.substring(0, textBeforeCursor.length - engWord.length);
    const suffix = value.substring(cursor);

    const mlWithSpace = prefix + suggestion + ' ';
    const newText = mlWithSpace + suffix;
    onChange(newText);

    setActiveWord('');
    setSuggestions([]);

    const newCursor = mlWithSpace.length;
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 10);
  };

  // Key down handler for Spacebar, Enter, Comma, Period, and Digit keys
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const el = inputRef.current;
    if (!el || disabled) return;

    // Clear undo reference on any keypress
    lastConversionRef.current = null;

    // 2. Digit keys 1-6 for choosing active suggestions
    if (suggestions.length > 0 && /^[1-6]$/.test(e.key)) {
      e.preventDefault();
      const idx = parseInt(e.key, 10) - 1;
      if (idx < suggestions.length) {
        selectSuggestion(suggestions[idx]);
        return;
      }
    }

    // 3. Spacebar, Enter, Comma, Period word conversion
    if (e.key === ' ' || e.key === 'Enter' || e.key === ',' || e.key === '.') {
      const cursor = el.selectionStart || 0;
      const textBeforeCursor = value.substring(0, cursor);

      // Find last English word before cursor
      const match = textBeforeCursor.match(/([a-zA-Z]+)$/);
      if (match) {
        const engWord = match[1];
        if (/[a-zA-Z]/.test(engWord)) {
          e.preventDefault();
          
          // Get the most highly recommended candidate from suggestions
          const wordSuggestions = getMalayalamSuggestions(engWord);
          const mlWord = wordSuggestions.length > 0 ? wordSuggestions[0] : transliterateManglish(engWord);
          
          const prefix = textBeforeCursor.substring(0, textBeforeCursor.length - engWord.length);
          const suffix = value.substring(cursor);
          const delimiter = e.key === 'Enter' ? '\n' : e.key;

          const mlWithSpace = prefix + mlWord + delimiter;
          const newText = mlWithSpace + suffix;
          onChange(newText);

          lastConversionRef.current = {
            mlWithSpace,
            engWord,
          };

          const newCursorPos = mlWithSpace.length;
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
              inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
          }, 10);
        }
      } else {
        lastConversionRef.current = null;
      }
    } else {
      lastConversionRef.current = null;
    }
  };

  // Change handler for fallback space detection (mobile/virtual keyboards)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const rawVal = e.target.value;
    const el = inputRef.current;
    const cursor = el?.selectionStart || rawVal.length;

    // Check if a space or punctuation was just typed at the cursor after an English word
    const textBeforeCursor = rawVal.substring(0, cursor);
    const match = textBeforeCursor.match(/([a-zA-Z]+)(\s|[.,;:])$/);
    if (match) {
      const engWord = match[1];
      const delimiter = match[2];
      const wordSuggestions = getMalayalamSuggestions(engWord);
      const mlWord = wordSuggestions.length > 0 ? wordSuggestions[0] : transliterateManglish(engWord);
      
      const prefix = textBeforeCursor.substring(0, textBeforeCursor.length - (engWord.length + delimiter.length));
      const suffix = rawVal.substring(cursor);

      const mlWithSpace = prefix + mlWord + delimiter;
      const newText = mlWithSpace + suffix;
      onChange(newText);

      lastConversionRef.current = {
        mlWithSpace,
        engWord,
      };

      const newCursor = mlWithSpace.length;
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newCursor, newCursor);
        }
      }, 10);
      return;
    }

    onChange(rawVal);
  };

  // On blur, convert any unspaced trailing English word and clear suggestions
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (props.onBlur) {
      props.onBlur(e as any);
    }
    // Timeout prevents suggestions from clearing before onClick fires on suggestions buttons
    setTimeout(() => {
      setActiveWord('');
      setSuggestions([]);
    }, 150);

    if (!value || disabled) return;
    const match = value.match(/([a-zA-Z]+)$/);
    if (match) {
      const engWord = match[1];
      const wordSuggestions = getMalayalamSuggestions(engWord);
      const mlWord = wordSuggestions.length > 0 ? wordSuggestions[0] : transliterateManglish(engWord);
      const prefix = value.substring(0, value.length - engWord.length);
      onChange(prefix + mlWord);
    }
  };

  // Insert character from Virtual Keyboard at cursor position
  const handleInsertCharacter = (char: string) => {
    const el = inputRef.current;
    if (!el) {
      onChange((value || '') + char);
      return;
    }

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const currentText = value || '';

    const newText = currentText.substring(0, start) + char + currentText.substring(end);
    onChange(newText);

    // Restore focus and cursor position
    setTimeout(() => {
      el.focus();
      const newCursorPos = start + char.length;
      el.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  return (
    <div className="w-full space-y-1.5">
      {/* Input or Textarea with Embedded Keypad Button */}
      <div className="relative w-full">
        {multiline ? (
          <>
            <Textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onKeyUp={checkCursorAndSuggestions}
              onSelect={checkCursorAndSuggestions}
              onClick={checkCursorAndSuggestions}
              onFocus={checkCursorAndSuggestions}
              placeholder={placeholder || "മംഗ്ലീഷിൽ ടൈപ്പ് ചെയ്ത് space അമർത്തുക (e.g. 'kollam' -> 'കൊല്ലം')..."}
              rows={rows}
              disabled={disabled}
              className={`font-sans pr-10 resize-y min-h-[80px] ${className}`}
              {...(props as any)}
            />
            <div className="absolute right-1.5 top-1.5 z-10">
              <MalayalamKeyboardPopover
                isOpen={keypadOpen}
                onOpenChange={setKeypadOpen}
                onInsertCharacter={handleInsertCharacter}
              />
            </div>
          </>
        ) : (
          <>
            <Input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onKeyUp={checkCursorAndSuggestions}
              onSelect={checkCursorAndSuggestions}
              onClick={checkCursorAndSuggestions}
              onFocus={checkCursorAndSuggestions}
              placeholder={placeholder || "മംഗ്ലീഷിൽ ടൈപ്പ് ചെയ്ത് space അമർത്തുക (e.g. 'kollam' -> 'കൊല്ലം')..."}
              disabled={disabled}
              className={`font-sans pr-10 ${className}`}
              {...(props as any)}
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10">
              <MalayalamKeyboardPopover
                isOpen={keypadOpen}
                onOpenChange={setKeypadOpen}
                onInsertCharacter={handleInsertCharacter}
              />
            </div>
          </>
        )}
      </div>

      {/* Suggestion Bar */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-md text-xs transition-all duration-200">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider px-1">സൂചനകൾ:</span>
          {suggestions.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              onMouseDown={(e) => {
                // Prevent input focus loss so click behaves correctly
                e.preventDefault();
              }}
              onClick={() => selectSuggestion(sug)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-background hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border border-border hover:border-emerald-300 dark:hover:border-emerald-850 rounded shadow-sm cursor-pointer font-medium text-[13px] transition-all"
            >
              <span className="text-[10px] text-muted-foreground font-mono">{idx + 1}</span>
              <span>{sug}</span>
            </button>
          ))}
        </div>
      )}

      {/* Helper text/tip */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80 px-0.5">
        <Type className="h-2.5 w-2.5 text-emerald-500" />
        <span>മംഗ്ലീഷിൽ ടൈപ്പ് ചെയ്ത് <kbd className="px-1 py-0.2 bg-muted border border-border rounded text-[9px] font-mono">Space</kbd> അമർത്തുക</span>
      </div>
    </div>
  );
};
