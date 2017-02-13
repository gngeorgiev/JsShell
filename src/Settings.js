const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const readline = require('readline');
const spawn = require('cross-spawn');
const vm = require('vm');

const { error } = require('./utils');
const Initializable = require('./Initializable');

const defaultConfigPath = path.resolve(__dirname, '..', 'default');

class Settings extends Initializable {
    constructor(shell) {
        super();

        this.shell = shell;
        this.configFolder = path.join(process.env.HOME, '.jshell');
        this.configPath = path.join(this.configFolder, 'config.js');
        this.config = {
            prompt: `$>`,
            env: process.env,
            history: {
                location: path.join(this.configPath, 'history'),
                maxFileSize: 1000,
                maxSessionSize: 100
            }
        };
        this._init();

        this.historyFile = this._getConfigProperty('history').location;
    }

    _readConfig() {
        try {
            const configFolder = this.configFolder;
            const module = {exports: {}};
            const context = vm.createContext(_.extend({}, global, {
                module,
                __dirname: this.configFolder,
                __filename: this.configPath,

                require(module) {
                    try {
                        return require(path.join(configFolder, 'node_modules', module));
                    } catch (e) {
                        return require(module);
                    }
                }
            }));

            const configContents = fs.readFileSync(this.configPath, {encoding: 'utf8'});
            vm.runInContext(configContents, context);
            const userConfig = module.exports;
            const config = _.isFunction(userConfig) ? userConfig(this.shell) : userConfig;

            this.config = _.merge({}, this.config, config);
            this._fireInitialized();
        } catch (e) {
            console.log(`Error while reading config - ${this.configPath}: ${e}`.red);
        }
    }

    _installNpmModules() {
        return new Promise(resolve => {
            console.log('Installing config npm modules...');

            spawn('npm', ['install'], {
                cwd: this.configFolder,
                detached: true,
                stdio: 'inherit'
            }).on('exit', () => {
                resolve();
            });
        });
    }

    _askInitShellQuestion() {
        return new Promise(resolve => {
            if (!process.stdin.isTTY) {
                return resolve(true);
            }

            const questionRl = readline.createInterface(process.stdin, process.stdout);
            questionRl.question(`There does not seem to be a configuration for JShell initialized. Do you want to initialize it now? y/n (${this.configPath}) `.green,
                yesNo => {
                    questionRl.close();

                    if (yesNo === 'n' || yesNo === 'no') {
                        return resolve(false);
                    }

                    return resolve(true);
                });
        });
    }

    _init() {
        const configExists = fs.existsSync(this.configPath);
        if (configExists) {
            return this._readConfig();
        }

        const printError = err => {
            return this.shell.error(error.wrap(`Failed initializing config: ${err}`));
        };

        this._askInitShellQuestion()
            .then(yesNo => {
                if (!yesNo) {
                    return this.shell.exit();
                }

                fs.mkdir(this.configFolder, err => {
                    if (err && err.code !== 'EEXIST') {
                        return printError(err);
                    }

                    fs.copy(defaultConfigPath, this.configFolder, err => {
                        if (err) {
                            return printError(err);
                        }

                        this._installNpmModules().then(() => {
                            this._readConfig();
                        });
                    });
                });
            });
    }

    _getConfigProperty(field) {
        const prop = this.config[field];

        if (typeof prop === 'function') {
            return prop();
        }

        return prop;
    }
}

module.exports = function (shell, callback) {
    const settings = new Settings(shell);

    settings.onInitialized(() => {
        const proxy = new Proxy(settings, {
            get(settings, prop) {
                if (settings.config[prop]) {
                    return settings._getConfigProperty(prop);
                }

                if (settings[prop]) {
                    return settings[prop];
                }

                return null;
            }
        });

        return callback(proxy);
    });
};