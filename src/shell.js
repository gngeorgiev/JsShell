const readline = require('readline');
const fs = require('fs');
const Settings = require('./Settings');
const Completer = require('./complete/Completer');
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
            this.initialized = true;
            this.settings = settings;
            this.paths = this.settings.env.PATH.split(':');

            this.home = this.settings.env.HOME;
            this.cwd = this.home;
            this.completer = new Completer(this);
            this.executor = new Executor(this);

            const input = process.stdin;
            const output = process.stdout;
            const terminal = true;
            const completer = this.completer.complete.bind(this.completer);
            this.rl = readline.createInterface({input, output, terminal, completer});
            this.setPrompt();
            this._readHistory();

            readline.emitKeypressEvents(process.stdin, this.rl);
            if (process.stdin.isTTY) {
                process.stdin.setRawMode(true);
            }

            this._lineCallbacks = [];
            this._attachHandlers();
            this._fireInitialized();
        });
    }

    _attachHandlers() {
        this.rl
            .on('line', line => {
                this.writeLn(line);
            })
            .on('SIGINT', () => {
                this.rl.write('^C');
                this.clear();
                this.setPrompt();

                return false;
            })
            .on('close', () => {
                this.exit();
            });
    }

    _readHistory() {
        try {
            const history = fs.readFileSync(this.settings.historyFile, 'utf8').split('\r\n');
            const reversedHistory = [];
            const maxHistoryLength = this.settings.history.maxSessionSize;
            for (let i = history.length - 1; i >= 0; i--) { //filtering and reversing in the same loop for beter performance
                const entry = history[i];
                if (entry) {
                    reversedHistory.push(history[i]);
                }

                if (reversedHistory.length >= maxHistoryLength) {
                    break;
                }
            }

            this.rl.history = reversedHistory;
        } catch (e) {
            return this.writeToDebugLog(e);
        }
    }

    _writeHistory(line = null) {
        if (!line) {
            return;
        }

        //this will need optimization once the history grows bigger
        fs.appendFileSync(this.settings.historyFile, `${line}\r\n`); //TODO: max file lines
        while (this.rl.history.length > this.settings.history.maxSessionSize) {
            this.rl.history.splice(0, 1);
        }
    }

    onLine(cb) {
        this._lineCallbacks.push(cb);
    }

    exec(cmd) {
        return this.executor.executeCommandSync(cmd);
    }

    spawn(cmd, args, opts) {
        return this.executor.spawn(cmd, args, opts);
    }

    exit(code = 0, err = null) {
        this.error(err);
        process.exit(code);
    }

    setPrompt() {
        this.rl.setPrompt(this.settings.prompt);
        this.rl.prompt(true);
    }

    writeLn(line) {
        this._writeHistory(line);
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

                this._readHistory();
                this.setPrompt();
            })
            .catch(e => {
                this.error(e);
            });
    }

    writeToDebugLog(e) {
        fs.appendFileSync(path.join(this.settings.configFolder, 'debug.log'), `${e.toString()}\r\n`);
    }

    error(e) {
        if (!e) {
            return;
        }

        console.log(e.message);
        if (e.stack) {
            console.log(e.stack);
        }

        this.writeToDebugLog(e);

        this.setPrompt();
    }

    clear() {
        this.rl.clearLine(process.stdin, 0);
    }

    printLn(str) {
        console.log(str);
    }

    pause() {
        this.rl.pause();
        if (process.stdin.setRawMode) {
            process.stdin.setRawMode(false);
        }
    }

    resume() {
        this.rl.resume();
        if (process.stdin.setRawMode) {
            process.stdin.setRawMode(true);
        }
    }
}

module.exports = new Shell();
