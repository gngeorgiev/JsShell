const readline = require('readline');
const Settings = require('./Settings');
const Completer = require('./Completer');
const Executor = require('./Executor');
const path = require('path');

class Shell {
    constructor() {
        this.settings = Settings(this);

        this.home = this.settings.env.HOME;
        this.cwd = this.home;
        this.completer = new Completer(this);
        this.executor = new Executor(this);

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
            completer: this.completer.complete.bind(this.completer)
        });
        this.rl = rl;
        this.rl.setPrompt(this.settings.prompt);
        this.rl.prompt();

        readline.emitKeypressEvents(process.stdin, rl);
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }

        this._lineCallbacks = [];
        this._keypressCallbacks = [];

        this._attachHandlers();
    }

    get absoluteCwd() {
        return this._cwd;
    }

    get cwd() {
        const cwd = this._cwd;
        return cwd.replace(this.home, '~');
    }

    get env() {
        return this.settings.env || process.env;
    }

    set cwd(val) {
        this._cwd = path.normalize(val);
        process.chdir(this._cwd);
    }

    _attachHandlers() {
        process.stdin.on('keypress', (_, data) => {
            this._keyPress(data);
        });

        this.rl.on('line', line => {
            this.writeLn(line);
        }).on('close', () => {
            process.exit(0);
        });
    }

    _keyPress(data) {
        this._keypressCallbacks.forEach(cb => cb(data));
    }

    onLine(cb) {
        this._lineCallbacks.push(cb);
    }

    onKeypress(cb) {
        this._keypressCallbacks.push(cb);
    }

    exec(cmd) {
        return this.executor.executeCommandSync(cmd);
    }

    writeLn(line) {
        const allLineListenersPromises = this._lineCallbacks.map(cb => {
            return new Promise((resolve, reject) => {
                try {
                    cb(line, resolve);
                } catch (e) {
                    reject(e);
                }
            })
        });

        Promise.all(allLineListenersPromises)
            .then(() => {
                this.rl.setPrompt(this.settings.prompt);
                this.rl.prompt();
            })
            .catch(e => {
                console.log(e);
            });
    }

    print(str, opts) {
        opts = opts || {};
        this.rl.write(str, opts);
    }

    printLn(str, opts) {
        this.write(str + '\r\n', opts);
    }
}

module.exports = new Shell();