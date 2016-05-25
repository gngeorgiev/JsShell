const fs = require('fs');
const path = require('path');
const spawn = require('cross-spawn');
const { execSync } = require('child_process');
const stream = require('stream');

const constants = require('./constants');
const Evaluator = require('./Evaluator');

class Executor {
    constructor(shell) {
        this.shell = shell;
        this.evaluator = new Evaluator(this.shell);

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

    executeSystemCommand(systemCmd, cmd) {
        return new Promise((resolve, reject) => {
            const previousCmdIsPipe = cmd.previous && cmd.previous.operation === constants.CommandOperation.Pipe;
            const stdioStdin = previousCmdIsPipe ? 'pipe' : 'inherit';

            const cmdIsPipe = cmd.operation === constants.CommandOperation.Pipe;
            const stdioStdout = cmdIsPipe ? 'pipe' : 'inherit';

            const childProcOptions = {
                env: this.shell.settings.env,
                stdio: [stdioStdin, stdioStdout, 'inherit']
            };

            const childProc = spawn(systemCmd, cmd.args, childProcOptions);

            const stdoutStream = new stream.Writable();
            stdoutStream._write = data => {
                cmd.value = data.toString();
            };

            if (cmdIsPipe) {
                childProc.stdout.pipe(stdoutStream);
            }

            if (previousCmdIsPipe) {
                childProc.stdin.setEncoding('utf-8');
                childProc.stdin.write(cmd.previous.value);
                childProc.stdin.end();
            }

            childProc.on('exit', code => {
                if (cmd.operation === constants.CommandOperation.Background) {
                    this.shell.printLn(`[${childProc.pid}] exited with code - ${code}`);
                }

                cmd.exitCode = code;
            });
            childProc.on('close', () => {
                resolve();
            });
            childProc.on('error', err => {
                reject(err);
            });
        });
    }

    executeJshellCommand(cmd) {
        return this.evaluator.evaluate(cmd.cmdFull);
    }

    executeCdCommand(args) {
        return new Promise(resolve => {
            let cdPath = args.length ? args[0] : '..';

            let newCwd = '';
            if (cdPath.charAt(0) === '/') {
                newCwd = path.normalize(cdPath);
            } else {
                newCwd = path.join(this.shell.absoluteCwd, cdPath);
            }

            fs.exists(newCwd, exists => {
                if (exists) {
                    this.shell.cwd = newCwd;
                    return resolve();
                }

                return resolve(`No such directory ${cdPath}`)
            });
        });
    }

    wrapExecuteCommand(cmd) {
        return new Promise((resolve, reject) => {
            let commandExecutePromise;

            if (cmd.cmd === constants.Command.Cd) {
                commandExecutePromise = this.executeCdCommand(cmd.args);
            } else {
                const systemCmd = this._findSystemPath(cmd.cmd);
                if (systemCmd) {
                    commandExecutePromise = this.executeSystemCommand(systemCmd, cmd);
                } else {
                    commandExecutePromise = this.executeJshellCommand(cmd);
                }
            }

            if (cmd.operation === constants.CommandOperation.And
                && cmd.previous && cmd.previous.exitCode !== 0) {
                //if the cmd is executed with and we must ensure that the previous command exited with 0
                return reject();
            } else if (cmd.operation === constants.CommandOperation.Background) {
                //if the cmd is a background one we do not care what happens to it
                return resolve();
            }

            //otherwise we will continue running commands serially
            commandExecutePromise.then(() => {
                resolve();
            }, reject);
        });
    }
    
    executeNextCommand(iterator, callback) {
        const next = iterator.next();
        if (next.done) {
            return callback();
        }

        const cmd = next.value;
        this.wrapExecuteCommand(cmd)
            .then(() => {
                return this.executeNextCommand(iterator, callback);
            })
            .catch(err => {
                return callback(err);
            })
    }

    execute(parsedLine) {
        return new Promise((resolve, reject) => {
            //we need to execute the commands serially
            //we also need to pass the value of the previous one if its a pipe
            const commands = parsedLine.commands;
            if (!commands.length) {
                return resolve();
            }

            const commandsIterator = commands[Symbol.iterator]();
            this.executeNextCommand(commandsIterator, (err) => {
                if (err) {
                    return reject(err);
                }
                
                return resolve();
            });
        });
    }
}

module.exports = Executor;