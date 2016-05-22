const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const constants = require('./constants');

class Executor {
    constructor(shell) {
        this.shell = shell;

        this.path = this.shell.settings.path;
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

    _executeSystemCommand(systemCmd, args, callback) {
        const childProc = execFile(systemCmd, args, {
            cwd: __dirname //TODO:
        });

        childProc.on('close', () => {
            callback();
        });

        childProc.stdout.on('data', data => {
            console.log(data);
        });

        childProc.stderr.on('data', data => {
            console.log(data);
        });
    }

    _executeJshellCommand(cmd) {
        return eval(cmd);
    }

    _executeCdCommand(args) {
        let cdPath = args.length ? args[0] : '..';
        cdPath = cdPath.replace(new RegExp('\$[a-zA-Z]+|\~', 'g'), (match) => {
            if (match === '~') {
                match = 'HOME';
            }

            return process.env[match] || match;
        });

        let newCwd = '';
        if (cdPath.charAt(0) === '/') {
            newCwd = path.normalize(cdPath);
        } else {
            newCwd = path.join(this.shell.actualCwd, cdPath);
        }

        if (fs.existsSync(newCwd)) {
            this.shell.cwd = newCwd;
        } else {
            return `No such directory ${cdPath}`;
        }
    }

    execute(parsedLine) {
        return new Promise(resolve => {
            const allCommandsResolvedPromises = parsedLine.commands.map(cmd => {
                if (cmd.cmd === constants.Command.Cd) {
                    return this._executeCdCommand(cmd.args);
                }
                
                return new Promise(resolveCmd => {
                    const systemCmd = this._findSystemPath(cmd.cmd);
                    if (systemCmd) {
                        return this._executeSystemCommand(systemCmd, cmd.args, () => {
                            resolveCmd();
                        });
                    }

                    const shellResult = this._executeJshellCommand();
                    return resolveCmd(shellResult)
                });
            });

            Promise.all(allCommandsResolvedPromises).then(resolve);
        });
    }
}

module.exports = Executor;