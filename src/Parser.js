const { expandPath } = require('./shellUtils');

class Parser {
    constructor(shell) {
        this.shell = shell;
    }
    
    parse(line) {
        return {
            commands: line
                .split('&&') //TODO: background tasks with &
                .map(cmd => {
                    const cmdAndArgs = cmd.trim().split(' ');
                    const actualCmd = cmdAndArgs[0].trim();
                    const cmdArgs = cmdAndArgs.slice(1).map(arg => arg.trim());
                    return {
                        cmd: actualCmd,
                        args: cmdArgs,
                        argsClean: cmdArgs.map(arg => expandPath(arg, this.shell)) //TODO: probably we will have to do something else here
                    }
                })
        }
    }
}

module.exports = Parser;
