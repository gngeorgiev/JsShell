const { expandPath } = require('./shellUtils');
const { CommandOperation } = require('./constants');
const _ = require('lodash');

class Parser {
    constructor(shell) {
        this.shell = shell;
    }

    _buildCommand(tokens, operation) {
        return {
            cmd: tokens[0],
            args: tokens.slice(1).map(arg => arg.trim()).map(arg => expandPath(arg, this.shell)), //TODO: is this needed?
            operation: operation || CommandOperation.None,
            result: null,
            exitCode: null
        }
    }

   _parseCommandsFromLine(line) {
       const commandOperations = _.chain(CommandOperation).values().without(CommandOperation.None).value();
       const tokens = line.split(' ');
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
