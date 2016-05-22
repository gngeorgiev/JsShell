class Parser {
    constructor(shell) {
        this.shell = shell;
    }
    
    parse(line) {
        return {
            commands: line
                .split('&&')
                .map(cmd => {
                    const cmdAndArgs = cmd.trim().split(' ');
                    const actualCmd = cmdAndArgs[0];
                    const cmdArgs = cmdAndArgs.slice(1);
                    return {
                        cmd: actualCmd,
                        args: cmdArgs
                    }
                })
        }
    }
}

module.exports = Parser;
