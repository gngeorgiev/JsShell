const fs = require('fs');
const path = require('path');

module.exports = function (shell) {
    return {
        prompt: () => {
            const time = new Date().toLocaleTimeString().green;
            const cwd = shell.cwd.cyan;
            const sign = '$'.yellow;

            const isGitRepo = fs.existsSync(path.join(shell.absoluteCwd, '.git'));
            let gitBranch = isGitRepo ? shell.exec('git rev-parse --abbrev-ref HEAD').trim() : 'not a repo';
            gitBranch = ('{' + gitBranch + '}').red;

            return `${time} ${cwd} ${gitBranch} ${sign} `;
        }
    }
};