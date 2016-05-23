const { expandPath } = require('./shellUtils');
const constants = require('./constants');
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

    _buildCommand(tokens, operation) {
        return {
            cmd: tokens[0],
            args: tokens.slice(1).map(arg => arg.trim()).map(arg => expandPath(arg, this.shell)), //TODO: is this trimming needed?
            operation: operation || constants.CommandOperation.None,
            result: null,
            exitCode: null
        }
    }

    _tokenizeLine(line) {
        const tokens = [];
        const tokenSplitters = commandOperations.slice().concat(' ');
        const splitLine = line.split('');

        let lastMatchedIndex = 0;
        splitLine.forEach((char, index) => {
            if (tokenSplitters.includes(char) || index === line.length - 1) {
                const isOpChar = commandOperations.includes(char);

                const indexMatch = index === line.length - 1 && !isOpChar ? index + 1 : index;
                const token = splitLine.slice(lastMatchedIndex, indexMatch);
                tokens.push(token.join(''));
                if (isOpChar) {
                    tokens.push(char);
                }

                lastMatchedIndex = index + 1;
            }
        });

        return tokens;
    }

   _parseCommandsFromLine(line) {
       const tokens = this._tokenizeLine(line);
       const commands = [];

       let tokenIndex = 0;
       tokens.slice().forEach(token => { //lets iterate on a copy of the array since we are modifying it
           let command;

           if (commandOperations.includes(token)) {
               const cmdRaw = tokens.splice(0, tokenIndex);
               tokens.splice(0, 1); //remove the operation, e.g. &&
               command = this._buildCommand(cmdRaw, token);
               tokenIndex = 0;
           } else if (tokenIndex === tokens.length - 1 || (tokenIndex === 0 && tokens.length === 1)) {
               command = this._buildCommand(tokens);
           }

           if (command) {
               command.index = commands.length;
               command.next = () => commands[command.index + 1];
               command.previous = () => commands[command.index - 1];

               commands.push(command);
           }

           tokenIndex++;
       });

       return commands;
   }
    
    parse(line) {
        return {
            commands: this._parseCommandsFromLine(line)
        }
    }
}

module.exports = Parser;
