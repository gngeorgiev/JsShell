const defaultSettings = {
    prompt: `$>`,
    path: process.env.PATH
};

const configPath = '../demo/config.js';

class Settings {
    constructor(shell) {
        this.shell = shell;
        this.config = {};
    }

    readConfig() {
        const configFunc = require(configPath);
        const userConfig = configFunc(this.shell);
        this.config = Object.assign(this.config, defaultSettings, userConfig);
    }

    _callOrGet(field) {
        if (typeof field === 'function') {
            return field();
        }

        return field;
    }

    get prompt() {
        return this._callOrGet(this.config.prompt);
    }

    get path() {
        return this._callOrGet(this.config.path);
    }
}

module.exports = Settings;