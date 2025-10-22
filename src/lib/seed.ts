export class Seed {
  private static MAX_PART_LENGTH = 50;
  private static MAX_PARTS = 500;

  private static expandRange(part: string) {
    let results = [part];

    const numMatch = part.match(/\[(\-?\d+)-(\-?\d+)\]/);
    if (numMatch) {
      const [full, a, b] = numMatch;
      const [start, end] = [Number(a), Number(b)];
      if (Math.abs(end - start) - 1 > this.MAX_PARTS) return [];
      if (start > end) return [];

      results = [];
      for (let i = start; i <= end; i++)
        results.push(part.replace(full, i.toString()));
    }

    const charMatches = [...part.matchAll(/\[([a-zA-Z])-([a-zA-Z])\]/g)];
    if (charMatches.length <= 2) {
      for (const [full, a, b] of charMatches) {
        const range = Math.abs(b.charCodeAt(0) - a.charCodeAt(0)) + 1;
        if (range * results.length > this.MAX_PARTS) return [];

        const next: string[] = [];
        for (const r of results) {
          for (let c = a.charCodeAt(0); c <= b.charCodeAt(0); c++)
            next.push(r.replace(full, String.fromCharCode(c)));
        }
        results = next;
      }
    }

    if (results.length > this.MAX_PARTS) return [];
    return results.map(r => r.slice(0, this.MAX_PART_LENGTH));
  }

  public static expand(input: string) {
    return input
      .split(",")
      .map(part => part.trim())
      .filter(Boolean)
      .flatMap(p => this.expandRange(p));
  }
}
