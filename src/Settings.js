const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const readline = require('readline');
const Initializable = require('./Initializable');

const defaultConfig = {
    prompt: `$>`,
    env: process.env
};

const defaultConfigPath = '../default/config.js';

class Settings extends Initializable {
    constructor(shell) {
        super();

        this.shell = shell;
        this.configFolder = path.join(process.env.HOME, '.jshell');
        this.configPath = path.join(this.configFolder, 'config.js');
        this.config = defaultConfig;

        this._init();
    }

    _readConfig() {
        try {
            const userConfig = require(this.configPath);
            const config = _.isFunction(userConfig) ? userConfig(this.shell) : userConfig;

            this.config = Object.assign({}, this.config, config);
        } catch (e) {
            console.log(`Error while reading config - ${this.configPath}: ${e}`);
        }

        this._fireInitialized();
    }

    _init() {
        const printError = error => {
            return console.log(`Failed initializing config: ${error}`)
        };

        fs.exists(this.configPath, exists => {
            if (exists) {
                return this._readConfig();
            }

            const rl = readline.createInterface(process.stdin, process.stdout);

            rl.question(`There does not seem to be a configuration for JShell initialized. Where do you want to initialize it? (default: ${this.configPath})`.green,
                    configPath => {
                        rl.close();

                        if (configPath) {
                            this.configPath = configPath;
                        }

                        fs.mkdir(this.configFolder, err => {
                            if (err && err.code !== 'EEXIST') {
                                return printError(err);
                            }

                            const rs = fs.createReadStream(path.join(__dirname, defaultConfigPath));
                            rs.on('error', printError);
                            const ws = fs.createWriteStream(this.configPath);
                            ws.on('error', printError);
                            ws.on('finish', () => this._readConfig());
                            rs.pipe(ws);
                        });
                    });
        });
    }

    _callOrGet(field) {
        const prop = this.config[field];

        if (typeof prop === 'function') {
            return prop();
        }

        return prop;
    }
}

module.exports = function (shell) {
    const settings = new Settings(shell);

    return new Promise((resolve, reject) => {
        try {
            settings.onInitialized(() => {
                const proxy = new Proxy(settings, {
                    get(settings, prop) {
                        if (settings.config[prop]) {
                            return settings._callOrGet(prop);
                        }

                        return null;
                    }
                });

                return resolve(proxy);
            });
        } catch (e) {
            return reject(e);
        }
    });
};