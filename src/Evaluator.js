const vm = require('vm');
const _ = require('lodash');

class Evaluator {
    constructor(shell) {
        this.shell = shell;
        this.shell._ = _;
        this.sandbox = vm.createContext(this.shell);
    }

    evaluate(code) {
        return new Promise((resolve, reject) => {
            try {
                const result = vm.runInContext(code, this.sandbox);
                return resolve(result);
            } catch (e) {
                return reject(e);
            }
        });
    }
}

module.exports = Evaluator;