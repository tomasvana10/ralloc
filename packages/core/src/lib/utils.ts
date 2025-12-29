export function areSameCase(a: string, b: string) {
  return (
    (a === a.toLowerCase() && b === b.toLowerCase()) ||
    (a === a.toUpperCase() && b === b.toUpperCase())
  );
}
