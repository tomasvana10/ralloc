/**
 * Utility functions to expandGroupSeed a CSV of regex-like expressions or plain text
 * into a set of values
 */

import z from "zod";
import { MAX_GROUPS, MIN_GROUPS } from "./constants";

export enum ExpansionResultIssue {
  TooBig = "too_big",
  TooBigPart = "too_big_part",
  TooShort = "too_short",
  InvalidRange = "invalid_range",
  TooManyNumRanges = "too_many_num_ranges",
  TooManyCharRanges = "too_many_char_ranges",
  DuplicateValues = "duplicate_values",
}

export interface ExpansionResult {
  values: string[];
  issue?: ExpansionResultIssue;
}

export const GROUP_SEED = {
  PART_SEPARATOR: ",",
  MAX_PART_LENGTH: 50,
  MAX_PARTS: MAX_GROUPS,
  MIN_PARTS: MIN_GROUPS,
  MAX_NUM_RANGES_PER_PART: 2,
  MAX_CHAR_RANGES_PER_PART: 2,
  NUM_RANGE_REGEX: /\[(-?\d+)-(-?\d+)\]/g,
  CHAR_RANGE_REGEX: /\[([a-zA-Z])-([a-zA-Z])\]/g,
};

export const groupName = z.string().min(1).max(GROUP_SEED.MAX_PART_LENGTH);

function padNumeric(n: number, width: number) {
  return n.toString().padStart(width, "0");
}

export function areSameCase(a: string, b: string) {
  return (
    (a === a.toLowerCase() && b === b.toLowerCase()) ||
    (a === a.toUpperCase() && b === b.toUpperCase())
  );
}

export function expandGroupSeed(input: string): ExpansionResult {
  // this used to trim and filter out empty strings, but zod
  // takes care of it now
  const filtered = input.split(GROUP_SEED.PART_SEPARATOR);
  const values: string[] = [];

  let totalExpandedPartCount = 0;

  for (const part of filtered) {
    const result = expandPart(part);
    if (!Array.isArray(result)) return { values: [], issue: result };
    totalExpandedPartCount += result.length;
    if (totalExpandedPartCount > GROUP_SEED.MAX_PARTS)
      return { values: [], issue: ExpansionResultIssue.TooBig };
    values.push(...result);
  }

  if (values.length < GROUP_SEED.MIN_PARTS)
    return { values: [], issue: ExpansionResultIssue.TooShort };
  if (new Set(values).size < values.length)
    return { values: [], issue: ExpansionResultIssue.DuplicateValues };

  return { values };
}

function expandPart(part: string) {
  if (part.length > GROUP_SEED.MAX_PART_LENGTH)
    return ExpansionResultIssue.TooBigPart;
  let results = [part];

  const numericExpansionResult = expandNumericRanges(part, results);
  // ExpansionResultIssue was returned
  if (!Array.isArray(numericExpansionResult)) return numericExpansionResult;
  results = numericExpansionResult;

  const characterExpansionResult = expandCharacterRanges(part, results);
  // ditto
  if (!Array.isArray(characterExpansionResult)) return characterExpansionResult;
  results = characterExpansionResult;

  if (results.length > GROUP_SEED.MAX_PARTS) return ExpansionResultIssue.TooBig;
  return results;
}

function expandNumericRanges(
  part: string,
  results: string[],
): ExpansionResultIssue | string[] {
  const numRanges = [...part.matchAll(GROUP_SEED.NUM_RANGE_REGEX)];
  if (numRanges.length > GROUP_SEED.MAX_NUM_RANGES_PER_PART)
    return ExpansionResultIssue.TooManyNumRanges;

  let current = results;

  for (const [full, start, end] of numRanges) {
    if (start === end) return ExpansionResultIssue.InvalidRange;

    const [a, b] = [Number(start), Number(end)];

    const width =
      (start.length > 1 && start.startsWith("0")) ||
      (end.length > 1 && end.startsWith("0"))
        ? Math.max(start.length, end.length)
        : 0;

    if ((Math.abs(a - b) + 1) * current.length > GROUP_SEED.MAX_PARTS)
      return ExpansionResultIssue.TooBig;

    const next: string[] = [];

    for (const r of current) {
      if (a > b) {
        for (let i = a; i >= b; i--) {
          const padded = width > 0 ? padNumeric(i, width) : i.toString();
          next.push(
            r.replace(full, padded).slice(0, GROUP_SEED.MAX_PART_LENGTH),
          );
        }
      } else {
        for (let i = a; i <= b; i++) {
          const padded = width > 0 ? padNumeric(i, width) : i.toString();
          next.push(
            r.replace(full, padded).slice(0, GROUP_SEED.MAX_PART_LENGTH),
          );
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
): ExpansionResultIssue | string[] {
  const charRanges = [...part.matchAll(GROUP_SEED.CHAR_RANGE_REGEX)];
  if (charRanges.length > GROUP_SEED.MAX_CHAR_RANGES_PER_PART)
    return ExpansionResultIssue.TooManyCharRanges;

  let current = results;

  for (const [full, start, end] of charRanges) {
    if (start === end || !areSameCase(start, end))
      return ExpansionResultIssue.InvalidRange;

    const [a, b] = [start.charCodeAt(0), end.charCodeAt(0)];

    if ((Math.abs(b - a) + 1) * current.length > GROUP_SEED.MAX_PARTS)
      return ExpansionResultIssue.TooBig;

    const next: string[] = [];

    for (const r of current) {
      if (a > b) {
        for (let i = a; i >= b; i--) {
          next.push(
            r
              .replace(full, String.fromCharCode(i))
              .slice(0, GROUP_SEED.MAX_PART_LENGTH),
          );
        }
      } else {
        for (let i = a; i <= b; i++) {
          next.push(
            r
              .replace(full, String.fromCharCode(i))
              .slice(0, GROUP_SEED.MAX_PART_LENGTH),
          );
        }
      }
    }

    current = next;
  }

  return current;
}
