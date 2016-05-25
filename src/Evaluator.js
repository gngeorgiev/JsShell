const vm = require('vm');
const _ = require('lodash');

class Evaluator {
    constructor(shell) {
        this.shell = shell;
        this.context = this._buildContext();
        this.sandbox = vm.createContext(this.context);
    }

    _buildContext() {
        const globalContext = global;
        const staticContext = {
            _
        };
        const shellContext = {};
        Object.getOwnPropertyNames(this.shell).forEach(n => shellContext[n] = this.shell[n]);
        Object.getOwnPropertyNames(Object.getPrototypeOf(this.shell))
            .filter(n => n !== 'constructor' && _.isFunction(this.shell[n]) && n.charAt(0) !== '_')
            .forEach(n => shellContext[n] = this.shell[n].bind(this.shell));

        return _.extend({}, globalContext, staticContext, shellContext);
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