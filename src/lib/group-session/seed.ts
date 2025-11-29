/**
 * Utility functions to expand a CSV of regex-like expressions or plain text
 * into a set of values
 */

import { areSameCase } from "../utils";

export interface ExpansionResult {
  values: string[];
  issue?:
    | "too_big"
    | "too_short"
    | "invalid_range"
    | "too_many_num_ranges"
    | "too_many_char_ranges"
    | "duplicate_values";
}

export const seed = {
  PART_SEPARATOR: ",",
  MAX_PART_LENGTH: 50,
  MAX_PARTS: 500,
  MIN_PARTS: 2,
  MAX_NUM_RANGES_PER_PART: 2,
  MAX_CHAR_RANGES_PER_PART: 2,
  NUM_RANGE_REGEX: /\[(-?\d+)-(-?\d+)\]/g,
  CHAR_RANGE_REGEX: /\[([a-zA-Z])-([a-zA-Z])\]/g,
};

export function expand(input: string): ExpansionResult {
  // this used to trim and filter out empty strings, but zod
  // takes care of it now
  const filtered = input.split(seed.PART_SEPARATOR);
  const values = [];

  let totalExpandedPartCount = 0;

  for (const part of filtered) {
    const result = expandPart(part);
    if (!Array.isArray(result)) return { values: [], issue: result };
    totalExpandedPartCount += result.length;
    if (totalExpandedPartCount > seed.MAX_PARTS)
      return { values: [], issue: "too_big" };
    values.push(...result);
  }

  if (values.length < seed.MIN_PARTS) return { values: [], issue: "too_short" };
  if (new Set(values).size < values.length)
    return { values: [], issue: "duplicate_values" };

  return { values };
}

function expandPart(part: string): ExpansionResult["issue"] | string[] {
  let results = [part];

  const numericExpansion = expandNumericRanges(part, results);
  if (!Array.isArray(numericExpansion)) return numericExpansion;
  results = numericExpansion;

  const characterExpansion = expandCharacterRanges(part, results);
  if (!Array.isArray(characterExpansion)) return characterExpansion;
  results = characterExpansion;

  if (results.length > seed.MAX_PARTS) return "too_big";
  return results;
}

function padNumeric(n: number, width: number) {
  return n.toString().padStart(width, "0");
}

function expandNumericRanges(
  part: string,
  results: string[],
): ExpansionResult["issue"] | string[] {
  const numRanges = [...part.matchAll(seed.NUM_RANGE_REGEX)];
  if (numRanges.length > seed.MAX_NUM_RANGES_PER_PART)
    return "too_many_num_ranges";

  let current = results;

  for (const [full, start, end] of numRanges) {
    if (start === end) return "invalid_range";

    const [a, b] = [Number(start), Number(end)];

    const width =
      (start.length > 1 && start.startsWith("0")) ||
      (end.length > 1 && end.startsWith("0"))
        ? Math.max(start.length, end.length)
        : 0;

    if ((Math.abs(a - b) + 1) * current.length > seed.MAX_PARTS)
      return "too_big";

    const next: string[] = [];

    for (const r of current) {
      if (a > b) {
        for (let i = a; i >= b; i--) {
          const padded = width > 0 ? padNumeric(i, width) : i.toString();
          next.push(r.replace(full, padded).slice(0, seed.MAX_PART_LENGTH));
        }
      } else {
        for (let i = a; i <= b; i++) {
          const padded = width > 0 ? padNumeric(i, width) : i.toString();
          next.push(r.replace(full, padded).slice(0, seed.MAX_PART_LENGTH));
        }
      }
    }

    current = next;
  }

  return current;
}

function expandCharacterRanges(
  part: string,
  results: string[],
): ExpansionResult["issue"] | string[] {
  const charRanges = [...part.matchAll(seed.CHAR_RANGE_REGEX)];
  if (charRanges.length > seed.MAX_CHAR_RANGES_PER_PART)
    return "too_many_char_ranges";

  let current = results;

  for (const [full, start, end] of charRanges) {
    if (start === end) return "invalid_range";
    if (!areSameCase(start, end)) return "invalid_range";

    const [a, b] = [start.charCodeAt(0), end.charCodeAt(0)];

    if ((Math.abs(b - a) + 1) * current.length > seed.MAX_PARTS)
      return "too_big";

    const next: string[] = [];

    for (const r of current) {
      if (a > b) {
        for (let i = a; i >= b; i--) {
          next.push(
            r
              .replace(full, String.fromCharCode(i))
              .slice(0, seed.MAX_PART_LENGTH),
          );
        }
      } else {
        for (let i = a; i <= b; i++) {
          next.push(
            r
              .replace(full, String.fromCharCode(i))
              .slice(0, seed.MAX_PART_LENGTH),
          );
        }
      }
    }

    current = next;
  }

  return current;
}
