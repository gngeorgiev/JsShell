class ShellUtils {
    expandPath(path, shell) {
        return path.replace(new RegExp('\$[a-zA-Z]+|\~', 'g'), (match) => {
            if (match === '~') {
                match = 'HOME';
            }

            return shell.settings.env[match] || match;
        });
    }

    collapsePath(path, shell) {
        return path.replace(shell.settings.env.HOME, '~');
    }
}

module.exports = new ShellUtils();