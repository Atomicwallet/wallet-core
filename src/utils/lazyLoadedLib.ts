const NOT_INITIALIZED_PROMISE: Promise<unknown> | null = null;

/**
 * LazyLoadedLib - Loads library components on request
 */
export default class LazyLoadedLib<TModule> {
  private importLib: () => Promise<TModule>;
  private promise: Promise<TModule> | null;

  /**
   * Initializes lib template with required components
   *
   * @param importLib - Function that imports the library
   */
  constructor(importLib: () => Promise<TModule>) {
    this.importLib = importLib;
    this.promise = null;
  }

  /**
   * Gets the library or component
   *
   * @returns Promise resolving to the loaded library or component
   * @throws Error if the dynamically loaded module cannot be loaded
   */
  async get(): Promise<TModule> {
    if (!this.isLibLoaded()) {
      this.loadLib();
    }

    return this.promise!;
  }

  private isLibLoaded(): boolean {
    return this.promise !== NOT_INITIALIZED_PROMISE;
  }

  private loadLib(): void {
    this.promise = this.importLib();
  }
}
