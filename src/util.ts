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
