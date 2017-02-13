const fs = require('fs');
const path = require('path');
const Parser = require('../Parser');
const { flow, shell } = require('../utils');
const FileCompleter = require('./FileCompleter');

class Completer {
    constructor(shell) {
        this.shell = shell;
        this.parser = new Parser(this.shell);

        this.pathCompleters = [];
        this.shell.paths.forEach(path => {
            this.pathCompleters.push(new FileCompleter(this.shell, path));
        });
    }

    _complete(line, callback) {
        //TODO: complete files, git branches, bash autocompletions, others?
        const parsedLine = this.parser.parse(line);
        if (!parsedLine.commands.length) {
            return callback(null, [[], line]);
        }

        const lastCommand = parsedLine.commands[parsedLine.commands.length - 1];
        let toAutocomplete;
        const args = lastCommand.args;
        if (args.length) {
            toAutocomplete = args[args.length - 1];
        } else {
            toAutocomplete = lastCommand.cmd;
        }

        toAutocomplete = shell.expandPath(toAutocomplete, this.shell);

        let fileToMatch;
        let fileBaseDir;
        const isDirPath = toAutocomplete.endsWith('/');
        if (isDirPath) { //if the last char is slash we want to show all files
            fileToMatch = '';
            fileBaseDir = toAutocomplete;
        } else {
            fileToMatch = path.basename(toAutocomplete);
            fileBaseDir = path.dirname(toAutocomplete);
        }

        let searchDir;
        const isAbsolutePath = path.isAbsolute(fileBaseDir);
        if (isAbsolutePath && fs.existsSync(fileBaseDir)) {
            searchDir = fileBaseDir;
        } else {
            searchDir = path.normalize(this.shell.absoluteCwd) === path.normalize(fileBaseDir) ?
                fileBaseDir : path.join(this.shell.absoluteCwd, fileBaseDir.replace(this.shell.absoluteCwd, ''));
        }

        let completersPipeline = [new FileCompleter(this.shell, searchDir)];
        if (!isAbsolutePath && !isDirPath) {
            completersPipeline = completersPipeline.concat(this.pathCompleters);
        }

        return flow.firstSerial(completersPipeline, completer => {
            return completer.complete(line, fileToMatch, fileBaseDir);
        }, r => r && r.length).then(results => {
            return callback(null, [results, line]);
        }).catch(err => {
            this.shell.error(err);
            return callback(err, [[], line]);
        });
    }

    complete(line, callback) {
        try {
            return this._complete(line, callback);
        } catch (e) {
            return callback(e, [[], line]);
        }
    }
}

module.exports = Completer;