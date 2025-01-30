/**
 * LazyLoadedLib - Loads library components on request
 */
export default class LazyLoadedLib<TModule> {
    private readonly importLib;
    private promise;
    /**
     * Initializes lib template with required components
     *
     * @param importLib - Function that imports the library
     */
    constructor(importLib: () => Promise<TModule>);
    /**
     * Gets the library or component
     *
     * @returns Promise resolving to the loaded library or component
     * @throws Error if the dynamically loaded module cannot be loaded
     */
    get(): Promise<TModule>;
    private isLibLoaded;
    private loadLib;
}
