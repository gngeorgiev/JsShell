const colors = require('colors/safe');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

module.exports = function (shell) {
    return {
        prompt() {
            const time = colors.green(new Date().toLocaleTimeString());
            const cwd = colors.cyan(shell.cwd);
            const sign = colors.yellow('$');

            const isGitRepo = fs.existsSync(path.join(shell.absoluteCwd, '.git'));
            if (isGitRepo) {
                let gitBranch = `{${shell.exec('git rev-parse --abbrev-ref HEAD')}}`;
                let isDirty = shell.exec('git status --porcelain');
                gitBranch = isDirty ? colors.red(gitBranch) : colors.green(gitBranch);
                
                
                return `${time} ${cwd} ${gitBranch} ${sign} `
            }

            return `${time} ${cwd} ${sign} `;
        },
        env() {
            return _.extend({}, process.env, {/*custom env here*/});
        },
        aliases() {
            return {
                'ls': 'ls --color=auto',
                'll': 'ls -la',
                'l': 'll',
                's': 'sudo',
                'g': 'git'
            }
        },
        context() {
            return {
                sayHi() {
                    return shell.printLn(`Hello ${shell.settings.env.USER}!`);
                }
            }
        }
    }
};