/** All k-sized combinations of `items`, order-preserving, no repeats. */
export function getCombinations<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];

  function helper(start: number, current: T[]) {
    if (current.length === size) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < items.length; i++) {
      helper(i + 1, [...current, items[i]]);
    }
  }

  helper(0, []);
  return result;
}
