class DefaultLogger {
    error(errorObject) {
        const msg = JSON.stringify(errorObject);
        console.error(msg);
    }
    log(logObject) {
        const msg = JSON.stringify(logObject);
        console.log(msg);
    }
    warn(warnObject) {
        const msg = JSON.stringify(warnObject);
        console.warn(msg);
    }
}
export default new DefaultLogger();
//# sourceMappingURL=defaultLogger.js.map