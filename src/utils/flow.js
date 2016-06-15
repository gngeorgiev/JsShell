const co = require('co');

class FlowUtils {
    _forEach(array, callback) {
        const flowControl = {
            done: false
        };

        const promise = new Promise((resolve, reject) => {
            co(function* () {
                for (let item of array) {
                    if (flowControl.done) {
                        return resolve();
                    }

                    try {
                        yield callback(item);
                    } catch (e) {
                        return reject(e);
                    }
                }

                return resolve();
            }.bind(this));
        });

        return { promise, flowControl };
    }

    firstSerial(array, callback, predicate) {
        return new Promise((resolve, reject) => {
            const { promise, flowControl } = this._forEach(array, item => {
                return callback(item)
                    .then(res => {
                        if (predicate(res)) {
                            flowControl.done = true;
                            return resolve(res);
                        }
                    });
            });

            promise.then(resolve);
            promise.catch(reject);
        });
    }

    serial(array, callback) {
        const { promise } = this._forEach(array, item => {
             return callback(item);
        });

        return promise;
    }
}

module.exports = new FlowUtils();