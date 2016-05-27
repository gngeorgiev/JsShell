const shellUtils = {
    expandPath(path, shell) {
        const expandedPath = path.replace(new RegExp('\$[a-zA-Z]+|\~', 'g'), (match) => {
            if (match === '~') {
                match = 'HOME';
            }

            return shell.settings.env[match] || match;
        });

        return expandedPath;
    },
    collapsePath(path, shell) {
        return path.replace(shell.settings.env.HOME, '~');
    }
};

module.exports = shellUtils;