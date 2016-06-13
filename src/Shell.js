const readline = require('readline');
const Settings = require('./Settings');
const Completer = require('./Complete/Completer');
const Executor = require('./Executor');
const path = require('path');
const Initializable = require('./Initializable');

class Shell extends Initializable {
    constructor() {
        super();

        this._initialize();
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

    _initialize() {
        Settings(this, settings => {
            this.settings = settings;
            this.paths = this.settings.env.PATH.split(':');

            this.home = this.settings.env.HOME;
            this.cwd = this.home;
            this.completer = new Completer(this);
            this.executor = new Executor(this);

            this.rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                terminal: true,
                completer: this.completer.complete.bind(this.completer)
            });
            this.setPrompt();

            readline.emitKeypressEvents(process.stdin, this.rl);
            if (process.stdin.isTTY) {
                process.stdin.setRawMode(true);
            }

            this._lineCallbacks = [];
            this._keypressCallbacks = [];

            this._attachHandlers();

            this._fireInitialized();
        });
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

    setPrompt() {
        this.rl.setPrompt(this.settings.prompt);
        this.rl.prompt();
    }

    writeLn(line) {
        const allLineListenersPromises = this._lineCallbacks.map(cb => {
            return new Promise((resolve, reject) => {
                try {
                    cb(line, result => {
                        if (result instanceof Error) {
                            return reject(result);
                        }

                        return resolve(result);
                    });
                } catch (e) {
                    reject(e);
                }
            })
        });

        Promise.all(allLineListenersPromises)
            .then(results => {
                results.filter(cmd => !!cmd && !!cmd.value).forEach(cmd => {
                    this.printLn(cmd.value);
                });
                this.setPrompt();
            })
            .catch(e => {
                console.log(e);
                this.setPrompt();
            });
    }

    printLn(str) {
        console.log(str);
    }

    pause() {
        this.rl.pause();
        process.stdin.setRawMode(false);
    }

    resume() {
        this.rl.resume();
        process.stdin.setRawMode(true);
    }
}

module.exports = new Shell();
