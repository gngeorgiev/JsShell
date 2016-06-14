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
}

module.exports = ShellUtils;