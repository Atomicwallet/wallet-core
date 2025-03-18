const NOT_INITIALIZED_PROMISE = null;
/**
 * LazyLoadedLib - Loads library components on request
 */
export default class LazyLoadedLib {
    /**
     * Initializes lib template with required components
     *
     * @param importLib - Function that imports the library
     */
    constructor(importLib) {
        this.importLib = importLib;
        this.promise = null;
    }
    /**
     * Gets the library or component
     *
     * @returns Promise resolving to the loaded library or component
     * @throws Error if the dynamically loaded module cannot be loaded
     */
    async get() {
        if (!this.isLibLoaded()) {
            this.loadLib();
        }
        return this.promise;
    }
    isLibLoaded() {
        return this.promise !== NOT_INITIALIZED_PROMISE;
    }
    loadLib() {
        this.promise = this.importLib();
    }
}
//# sourceMappingURL=lazyLoadedLib.js.map