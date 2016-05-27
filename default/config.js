const fs = require('fs');
const path = require('path');

module.exports = function (shell) {
    return {
        prompt: () => {
            const time = new Date().toLocaleTimeString().green;
            const cwd = shell.cwd.cyan;
            const sign = '$'.yellow;

            const isGitRepo = fs.existsSync(path.join(shell.absoluteCwd, '.git'));
            if (isGitRepo) {
                const gitBranch = shell.exec('git rev-parse --abbrev-ref HEAD');
                return `${time} ${cwd} ${gitBranch} ${sign} `
            }

            return `${time} ${cwd} ${sign} `;
        }
    }
};