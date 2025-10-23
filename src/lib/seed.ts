import { areSameCase } from "./utils";

interface ExpansionResult {
  values: string[];
  issue?:
    | "too_big"
    | "too_short"
    | "invalid_range"
    | "too_many_num_ranges"
    | "too_many_char_ranges";
}

export class Seed {
  public static MAX_PART_LENGTH = 50;
  public static MAX_PARTS = 500;
  public static MIN_PARTS = 2;
  public static MAX_NUM_RANGES = 2;
  public static MAX_CHAR_RANGES = 2;

  private static expandRange(
    part: string
  ): ExpansionResult["issue"] | string[] {
    let results = [part];

    const numRanges = [...part.matchAll(/\[(-?\d+)-(-?\d+)\]/g)];
    if (numRanges.length > this.MAX_NUM_RANGES) return "too_many_num_ranges";
    for (const [full, start, end] of numRanges) {
      if (start === end) return "invalid_range";
      const [a, b] = [Number(start), Number(end)];
      if ((Math.abs(a - b) + 1) * results.length > this.MAX_PARTS)
        return "too_big";

      const next: string[] = [];
      for (const r of results) {
        if (a > b) {
          for (let i = a; i >= b; i--) {
            next.push(r.replace(full, i.toString()));
          }
        } else {
          for (let i = a; i <= b; i++) {
            next.push(r.replace(full, i.toString()));
          }
        }
      }
      results = next;
    }

    const charRanges = [...part.matchAll(/\[([a-zA-Z])-([a-zA-Z])\]/g)];
    if (charRanges.length > this.MAX_CHAR_RANGES) return "too_many_char_ranges";
    for (const [full, start, end] of charRanges) {
      if (start === end) return "invalid_range";
      if (!areSameCase(start, end)) return "invalid_range";
      const [a, b] = [start.charCodeAt(0), end.charCodeAt(0)];
      if ((Math.abs(b - a) + 1) * results.length > this.MAX_PARTS)
        return "too_big";

      const next: string[] = [];
      for (const r of results) {
        if (a > b) {
          for (let i = a; i >= b; i--)
            next.push(r.replace(full, String.fromCharCode(i)));
        } else {
          for (let i = a; i <= b; i++)
            next.push(r.replace(full, String.fromCharCode(i)));
        }
      }
      results = next;
    }

    if (results.length > this.MAX_PARTS) return "too_big";
    return results.map((r) => r.slice(0, this.MAX_PART_LENGTH));
  }

  public static expand(input: string): ExpansionResult {
    const filtered = input
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const values = [];

    for (const part of filtered) {
      const result = this.expandRange(part);
      if (!Array.isArray(result)) return { values: [], issue: result };
      values.push(...result);
    }

    if (values.length < this.MIN_PARTS)
      return { values: [], issue: "too_short" };

    return { values };
  }
}
