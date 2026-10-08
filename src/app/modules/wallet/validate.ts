/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Checks for what the wallet reads from the node and the block explorer: values as Postgres writes
// them, dates a clock can show, and text that cannot disguise itself

// A comment is the contract's own text: shown up to this long
const COMMENT_LENGTH = 300;

const INT64_MIN = -(1n << 63n);
const INT64_MAX = (1n << 63n) - 1n;
export const DIGITS = /^\d+$/;
// The latest time a JS Date can hold (ms)
export const MAX_TIME = 8.64e15;

// A bigint column as Postgres writes it: canonical, in range
export const isInt64 = (value: string) => /^-?\d{1,19}$/.test(value)
    && BigInt(value).toString() === value && BigInt(value) >= INT64_MIN && BigInt(value) <= INT64_MAX;

// Characters that can disguise text: controls, bidi overrides and isolates, zero-width marks, and
// letters drawn as blank (Hangul fillers, the blank Braille pattern, Khmer inherent vowels), which
// are neither of those classes nor white space
const HIDDEN_CHARACTERS = /[\p{Cc}\p{Cf}\u115F\u1160\u17B4\u17B5\u2800\u3164\uFFA0]/gu;

// More than two combining marks on a letter only stack up over the lines around it
const STACKED_MARKS = /(\p{M}{2})\p{M}+/gu;

export const cleanComment = (comment: string) => {
    const text = comment.replace(HIDDEN_CHARACTERS, ' ').replace(STACKED_MARKS, '$1').replace(/\s+/g, ' ').trim();
    // Cut by characters, not UTF-16 units, so no emoji is cut in half
    const characters = Array.from(text);
    return characters.length > COMMENT_LENGTH ? `${characters.slice(0, COMMENT_LENGTH).join('')}…` : text;
};

// A row id or block number: a positive bigint as Postgres writes it
export const isID = (value: string) => isInt64(value) && !value.startsWith('-') && '0' !== value;
