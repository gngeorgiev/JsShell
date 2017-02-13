const _ = require('lodash');

class Initializable {
    constructor() {
        this._onInitializedCallbacks = [];
        this.initialized = false;
        this.initializedArgs = null;
    }

    _fireInitialized(args = this.initializedArgs) {
        this.initialized = true;
        this.initializedArgs = args;
        process.nextTick(() => {
            this._onInitializedCallbacks.forEach(cb => cb(args));
            this._onInitializedCallbacks = [];
        });
    }

    onInitialized(cb) {
        this._onInitializedCallbacks.push(cb);
        if (this.initialized) {
            this._fireInitialized();
        }
    }
}

module.exports = Initializable;