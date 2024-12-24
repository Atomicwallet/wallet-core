const NOT_INITIALIZED_PROMISE = null;

/**
 * Loads lib components by request
 */
class LazyLoadedLib {
  /**
   * Imports a module
   * @typedef {function(): Promise} Importer
   */
  /**
   * Initializes lib template with required components
   *
   * @param  {Importer} importLib The imported library
   */
  constructor(importLib) {
    this.importLib = importLib;
    this.promise = NOT_INITIALIZED_PROMISE;
  }

  /**
   * Gets the lib component
   *
   * @param  {string} component Name of the component
   * @return {any}
   * @throws {Error} The dynamically loaded module cannot be loaded
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

  /**
   * Fabric
   * @param {string} importLibName
   * @returns {LazyLoadedLib}
   * @throws {Error}
   */
  static getInstance(importLibName) {
    if (typeof importLibName !== 'string') {
      throw new TypeError('importLibName not defined');
    }
    return new LazyLoadedLib(() => import(importLibName));
  }

  /**
   * Gets promise with lazy loaded lib or its component
   * @param {string} importLibName
   * @param {string} [componentName]
   * @returns {Promise<*>}
   * @throws {Error}
   */
  static getLazyImported(importLibName, componentName) {
    return LazyLoadedLib.getInstance(importLibName).get(componentName);
  }
}

export default LazyLoadedLib;
