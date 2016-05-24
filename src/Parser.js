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

    _findJavaScriptExpressions(line) {
        const tokens = [];

        line.split('').forEach(() => {

        });
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
                if (token.length) {
                    tokens.push({
                        value: token.join(''),
                        isJavaScript: false,
                        isOperationChar: false
                    });
                }

                if (isOpChar) {
                    tokens.push({
                        value: char,
                        isJavaScript: false,
                        isOperationChar: true
                    });
                }

                lastMatchedIndex = index + 1;
            }
        });

        return tokens;
    }

   _parseCommandsFromLine(line) {
       const tokens = this._tokenizeLine(line);
       const commands = [];

       let lastTokenIndex = 0;
       tokens.forEach((token, index) => { //lets iterate on a copy of the array since we are modifying it
           let command;

           const isCommandOperation = token.isOperationChar;
           const isLast = index === tokens.length - 1;
           const isSingleCommand = index === 0 && tokens.length === 1;

           if (isCommandOperation || isLast || isSingleCommand) {
               const cmdRaw = isLast ? tokens.slice(lastTokenIndex) : tokens.slice(lastTokenIndex, index);
               command = this._buildCommand(cmdRaw, token.value);

               command.index = commands.length;
               command.next = () => commands[command.index + 1];
               command.previous = () => commands[command.index - 1];
               commands.push(command);

               lastTokenIndex = index + 1;
           }
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
