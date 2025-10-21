import * as rts from "regex-to-strings";

export interface SeedExpansion {
  values: string[];
  compressed: boolean;
}

export class Seed {
  private static PART_LIMIT = 1000;

  private static expand_part(part: string) {
    return [...rts.expand(part).getIterator()];
  }

  public static expand(input: string): SeedExpansion {
    const expanded = input.split(",").flatMap(Seed.expand_part);
    const unique = [...new Set(expanded)];
    const values = unique.slice(0, Seed.PART_LIMIT).sort();

    return {
      values,
      compressed:
        unique.length < expanded.length || values.length < unique.length,
    };
  }
}
