const { shell } = require('./utils');
const constants = require('./constants');

class Command {
    constructor(shell, command, operation, commands) {
        this.shell = shell;
        this.cmdRaw = command;
        this.operation = operation || constants.CommandOperation.None;
        this.commands = commands;
        this.index = commands.length;
        this.value = null;
        this.exitCode = null;
    }

    _getCommandTokens(command) {
        const commandTokens = [];

        let matchedIndex = 0;
        let openningQuote = null;
        const pushToken = (index) => {
            commandTokens.push(command.substring(matchedIndex, index + 1));
            matchedIndex = index + 1;
        };

        command.split('').forEach((char, index) => {
            if (char === ' ' && openningQuote === null || index === command.length - 1) {
                return pushToken(index);
            }

            if (char === '"' || char === "'") {
                if (openningQuote === char) {
                    openningQuote = null;
                    return pushToken(index);
                } else {
                    openningQuote = char;
                }
            }
        });

        return commandTokens;
    }

    _getCommandFromAliases(cmd) {
        const aliases = this.shell.settings.aliases;

        let iterations = 0;
        const maxIterations = 10000; //lets try not to make an infinite loop

        let mappedCommand = cmd;
        let unaliasedCommand;
        while (mappedCommand && iterations < maxIterations) {
            iterations++;
            unaliasedCommand = mappedCommand;
            mappedCommand = aliases[mappedCommand];
        }

        return unaliasedCommand;
    }

    _getArgs(tokens) {
        return tokens.slice(1).map(arg => arg.trim()).map(arg => shell.expandPath(arg, this.shell));
    }

    get unaliasedCmd() {
        const commandTokens = this._getCommandTokens(this.cmdRaw);
        const cmd = commandTokens[0].trim();

        const unaliasedCmd = this._getCommandFromAliases(cmd);
        return unaliasedCmd;
    }

    get cmd() {
        const unaliasedCmd = this.unaliasedCmd;
        const unaliasedCmdTokens = this._getCommandTokens(unaliasedCmd);
        return unaliasedCmdTokens[0].trim();
    }

    get args() {
        const commandTokens = this._getCommandTokens(this.cmdRaw);
        return this._getArgs(commandTokens);
    }

    get next() {
        return this.commands[this.index + 1];
    }

    get previous() {
        return this.commands[this.index - 1];
    }
}

module.exports = Command;