const { isString } = require('lodash');

class ShellUtils {
    static expandPath(path, shell) {
        return path.replace(new RegExp('\$[a-zA-Z]+|\~', 'g'), match => {
            if (match === '~') {
                match = 'HOME';
            }

            return shell.settings.env[match] || match;
        });
    }

    static collapsePath(path, shell) {
        return path.replace(shell.settings.env.HOME, '~');
    }

    static escape(s) {
        if (Array.isArray(s)) {
            return s.map(s => ShellUtils.escape(s));
        }

        if (!isString(s)) {
            return s;
        }

        return s.replace(/(["\s'$`\\])/g,'\\$1');
    }
}

module.exports = ShellUtils;