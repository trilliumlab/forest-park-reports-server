// array extensions
declare global {
  interface Array<T> {
    /**
     * Runs a function in parallel for each element in the array via {@link Promise.all}
     *
     * @param func A function called for each element in the Array.
     */
    forEachParallel(
      this: Array<T>,
      func: (item: T) => Promise<void>,
    ): Promise<void>;
  }
}
Object.defineProperty(Array.prototype, "forEachParallel", {
  value: async function <T>(
    this: Array<T>,
    func: (item: T) => Promise<void>,
  ): Promise<void> {
    // TypeScript now correctly infers the result from this.map
    await Promise.all(this.map((item) => func(item)));
  },
});

/**
 * A base {@link Error} class that automatically sets name to the name of the subclass.
 */
export class ErrorBase extends Error {
  name = this.constructor.name;
}

/**
 * Clamps a number to the given range.
 *
 * @param val The number to clamp.
 * @param min The lower bound of the output.
 * @param max The upper bound of the output.
 */
export function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}
