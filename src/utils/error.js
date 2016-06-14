class ErrorUtils {
    static wrap(val) {
        if (val instanceof Error) {
            return val;
        }

        return new Error(val);
    }

    static wrapNoStack(val) {
        const err = ErrorUtils.wrap(val);
        err.stack = null;
        return err;
    }
}

module.exports = ErrorUtils;