const fs = require('fs');
const path = require('path');
const spawn = require('cross-spawn');
const { execSync } = require('child_process');
const constants = require('./constants');
const { expandPath } = require('./shellUtils');

class Executor {
    constructor(shell) {
        this.shell = shell;

        this.path = this.shell.settings.env.PATH;
        this.paths = this.path.split(':');
    }

    _findSystemPath(cmd) {
        const systemPath = this.paths.find(systemPath => {
            const cmdSystemPath = path.join(systemPath, cmd);
            return fs.existsSync(cmdSystemPath);
        });

        if (systemPath) {
            return path.join(systemPath, cmd);
        }

        return null;
    }

    executeCommandSync(cmd) {
        const res = execSync(cmd);
        return res.toString('utf8');
    }

    executeSystemCommand(systemCmd, args) {
        return new Promise((resolve, reject) => {
            const childProc = spawn(systemCmd, args, {
                env: process.env,
                stdio: 'inherit'
            });

            childProc.on('close', resolve);
            childProc.on('error', reject);
        });
    }

    executeJshellCommand(cmd) {
        return eval(cmd);
    }

    executeCdCommand(args) {
        let cdPath = args.length ? args[0] : '..';

        let newCwd = '';
        if (cdPath.charAt(0) === '/') {
            newCwd = path.normalize(cdPath);
        } else {
            newCwd = path.join(this.shell.absoluteCwd, cdPath);
        }

        if (fs.existsSync(newCwd)) {
            this.shell.cwd = newCwd;
        } else {
            return `No such directory ${cdPath}`;
        }
    }

    execute(parsedLine) {
        const allCommandsResolvedPromises = parsedLine.commands.map(cmd => {
            if (cmd.cmd === constants.Command.Cd) {
                return this.executeCdCommand(cmd.argsClean);
            }

            const systemCmd = this._findSystemPath(cmd.cmd);
            if (systemCmd) {
                return this.executeSystemCommand(systemCmd, cmd.argsClean);
            } else {
                return this.executeJshellCommand();
            }
        });

        return Promise.all(allCommandsResolvedPromises);
    }
}

module.exports = Executor;