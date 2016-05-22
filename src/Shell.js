const readline = require('readline');
const Settings = require('./Settings');

readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});

class Shell {
    constructor() {
        this.settings = new Settings(this);
        this.settings.readConfig();

        this.cwd = process.cwd();
        this.home = process.env.HOME;

        this._lineCallbacks = [];
        this._keypressCallbacks = [];

        this.rl = rl;
        this.rl.setPrompt(this.settings.prompt);
        this.rl.prompt();

        process.stdin.on('keypress', (_, data) => {
            this.pushKeyPress(data);
        });

        process.stdin.on('data', (data) => {
            //TODO: handle tabs etc
        });

        rl.on('line', line => {
            this.pushLine(line);
        }).on('close', () => {
            process.exit(0);
        });
    }

    get actualCwd() {
        return this._cwd;
    }

    get cwd() {
        const cwd = this._cwd;
        return cwd.replace(this.home, '~');
    }

    set cwd(val) {
        this._cwd = val;
    }

    onLine(cb) {
        this._lineCallbacks.push(cb);
    }

    onKeypress(cb) {
        this._keypressCallbacks.push(cb);
    }

    pushLine(line) {
        const allLineListenersPromises = this._lineCallbacks.map(cb => {
            return new Promise(resolve => {
                cb(line, resolve);
            })
        });

        Promise.all(allLineListenersPromises)
            .then(() => {
                this.rl.setPrompt(this.settings.prompt);
                this.rl.prompt();
            });
    }

    pushKeyPress(data) {
        this._keypressCallbacks.forEach(cb => cb(data));
    }

    write(str, opts) {
        opts = opts || {};
        this.rl.write(str, opts);
    }

    writeLn(str, opts) {
        this.write(str + '\r\n', opts);
    }
}

module.exports = Shell;