const defaultSettings = {
    prompt: `$>`,
    env: process.env
};

const configPath = '../demo/config.js';

class Settings {
    constructor(shell) {
        this.shell = shell;
        this.config = {};
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

    const configFunc = require(configPath);
    const userConfig = configFunc(shell);
    settings.config = Object.assign({}, defaultSettings, userConfig);

    return new Proxy(settings, {
        get(settings, prop) {
            if (settings.config[prop]) {
                return settings._callOrGet(prop);
            }

            return null;
        }
    });
};