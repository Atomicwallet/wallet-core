export * from './types.js';
class DefaultConfigManager {
    get(id) {
        return Promise.reject(new Error('ConfigManager not implemented'));
    }
    getLocal(id) {
        return Promise.reject(new Error('ConfigManager not implemented'));
    }
    register(id) { }
}
export default new DefaultConfigManager();
//# sourceMappingURL=index.js.map