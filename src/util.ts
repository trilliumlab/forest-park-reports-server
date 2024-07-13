// array extensions
declare global {
  interface Array<T> {
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
