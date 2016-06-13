const co = require('co');

class FlowUtils {
    _forEach(array, callback) {
        const flowControl = {
            done: false
        };

        const promise = co(function* () {
            for (let item of array) {
                if (flowControl.done) {
                    return;
                }

                yield callback(item);
            }
        }.bind(this));

        return { promise, flowControl };
    }

    firstSerial(array, callback, predicate) {
        return new Promise((resolve, reject) => {
            const { promise, flowControl }= this._forEach(array, item => {
                return callback(item)
                    .then(res => {
                        if (predicate(res)) {
                            flowControl.done = true;
                            return resolve(res);
                        }
                    });
            });

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