class BaseLogger {
    log(error) {
        console.log(`[BaseLogger]\n`, error);
    }
    error(error) {
        console.error(`[BaseLogger]\n`, error);
    }
}
class Logger {
    constructor() {
        this.logger = new BaseLogger();
    }
    setLogger(logger) {
        this.logger = logger;
    }
    log(error) {
        this.logger.log(error);
    }
    error(error) {
        this.logger.error(error);
    }
}
export default new Logger();
//# sourceMappingURL=logger.js.map