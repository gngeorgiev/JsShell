const _ = require('lodash');

class Initializable {
    constructor() {
        this._onInitializedCallbacks = [];
    }

    _fireInitialized(args) {
        process.nextTick(() => this._onInitializedCallbacks.forEach(cb => cb(args)));
    }

    onInitialized(cb) {
        this._onInitializedCallbacks.push(cb);
    }
}

module.exports = Initializable;