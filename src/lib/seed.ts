import { areSameCase } from "./utils";

interface ExpansionResult {
  values: string[];
  issue?:
    | "too_big"
    | "too_short"
    | "invalid_range"
    | "too_many_num_ranges"
    | "too_many_char_ranges"
    | "duplicate_values";
}

export class GroupSeed {
  public static MAX_PART_LENGTH = 50;
  public static MAX_PARTS = 500;
  public static MIN_PARTS = 2;
  public static MAX_NUM_RANGES_PER_PART = 2;
  public static MAX_CHAR_RANGES_PER_PART = 2;
  private static NUM_RANGE_REGEX = /\[(-?\d+)-(-?\d+)\]/g;
  private static CHAR_RANGE_REGEX = /\[([a-zA-Z])-([a-zA-Z])\]/g;

  private static expandRange(
    part: string,
  ): ExpansionResult["issue"] | string[] {
    let results = [part];

    const numRanges = [...part.matchAll(GroupSeed.NUM_RANGE_REGEX)];
    if (numRanges.length > GroupSeed.MAX_NUM_RANGES_PER_PART)
      return "too_many_num_ranges";
    for (const [full, start, end] of numRanges) {
      if (start === end) return "invalid_range";
      const [a, b] = [Number(start), Number(end)];
      if ((Math.abs(a - b) + 1) * results.length > GroupSeed.MAX_PARTS)
        return "too_big";

      const next: string[] = [];
      for (const r of results) {
        if (a > b) {
          for (let i = a; i >= b; i--) {
            next.push(
              r.replace(full, i.toString()).slice(0, GroupSeed.MAX_PART_LENGTH),
            );
          }
        } else {
          for (let i = a; i <= b; i++) {
            next.push(
              r.replace(full, i.toString()).slice(0, GroupSeed.MAX_PART_LENGTH),
            );
          }
        }
      }
      results = next;
    }

    const charRanges = [...part.matchAll(GroupSeed.CHAR_RANGE_REGEX)];
    if (charRanges.length > GroupSeed.MAX_CHAR_RANGES_PER_PART)
      return "too_many_char_ranges";
    for (const [full, start, end] of charRanges) {
      if (start === end) return "invalid_range";
      if (!areSameCase(start, end)) return "invalid_range";
      const [a, b] = [start.charCodeAt(0), end.charCodeAt(0)];
      if ((Math.abs(b - a) + 1) * results.length > GroupSeed.MAX_PARTS)
        return "too_big";

      const next: string[] = [];
      for (const r of results) {
        if (a > b) {
          for (let i = a; i >= b; i--)
            next.push(
              r
                .replace(full, String.fromCharCode(i))
                .slice(0, GroupSeed.MAX_PART_LENGTH),
            );
        } else {
          for (let i = a; i <= b; i++)
            next.push(
              r
                .replace(full, String.fromCharCode(i))
                .slice(0, GroupSeed.MAX_PART_LENGTH),
            );
        }
      }
      results = next;
    }

    if (results.length > GroupSeed.MAX_PARTS) return "too_big";
    return results;
  }

  public static expand(input: string): ExpansionResult {
    const filtered = input
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const values = [];

    let totalExpandedPartCount = 0;

    for (const part of filtered) {
      const result = GroupSeed.expandRange(part);
      if (!Array.isArray(result)) return { values: [], issue: result };
      totalExpandedPartCount += result.length;
      if (totalExpandedPartCount > GroupSeed.MAX_PARTS)
        return { values: [], issue: "too_big" };
      values.push(...result);
    }

    if (values.length < GroupSeed.MIN_PARTS)
      return { values: [], issue: "too_short" };
    if (new Set(values).size < values.length)
      return { values: [], issue: "duplicate_values" };

    return { values };
  }
}
