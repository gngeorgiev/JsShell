const constants = require('./constants');
const Command = require('./Command');
const _ = require('lodash');

const commandOperations = _
    .chain(constants.CommandOperation)
    .values()
    .without(constants.CommandOperation.None)
    .value();

class Parser {
    constructor(shell) {
        this.shell = shell;
    }

    _buildCommand(command, operation, commands) {
        return new Command(this.shell, command, operation, commands);
    }

    _parseLine(line) {
        const lineChars = line.split('');
        const commands = [];

        let lastMatchIndex = 0;
        lineChars.forEach((char, index) => {
            const isLast = index === line.length - 1;
            const isOperation = commandOperations.includes(char);

            if (char === constants.CommandOperation.Background && lineChars[index + 1] === constants.CommandOperation.Background) {
                return;
            }

            if (char === constants.CommandOperation.Background && lineChars[index - 1] === constants.CommandOperation.Background) {
                char = constants.CommandOperation.And
            }

            if (isOperation || isLast) {
                let matchingIndex = isLast ? undefined : index;
                if (char === constants.CommandOperation.And) {
                    matchingIndex--;
                }

                const cmdString = lineChars.slice(lastMatchIndex, matchingIndex).join('').trim();
                const operation = isOperation ? char : constants.CommandOperation.None;
                const cmd = this._buildCommand(cmdString, operation, commands);

                commands.push(cmd);
                lastMatchIndex = matchingIndex + char.length;
            }
        });

        return commands;
    }

    parse(line) {
        return {
            commands: this._parseLine(line)
        }
    }
}

module.exports = Parser;
