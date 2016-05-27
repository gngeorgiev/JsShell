const fs = require('fs');
const path = require('path');
const Parser = require('./Parser');
const { times } = require('lodash');
const { expandPath, collapsePath } = require('./shellUtils');

class Completer {
    constructor(shell) {
        this.shell = shell;
        this.parser = new Parser(this.shell);
    }

    _intersectStrings(into, str) {
        let intersectString = str;
        let match = into + str; //default
        times(str.length, () => {
            const intersectIndex = into.indexOf(intersectString);
            if (intersectIndex === -1) {
                intersectString = intersectString.substring(0, intersectString.length - 1);
            } else {
                let stringWithoutMatch = into.substring(0, intersectIndex);
                match = stringWithoutMatch + str;
            }
        });

        return match;
    }

    complete(line, callback) {
        //TODO: complete files, git branches, bash autocompletions, others?
        const parsedLine = this.parser.parse(line);
        if (!parsedLine.commands.length) {
            return callback(null, [[], line]);
        }

        const lastCommand = parsedLine.commands[parsedLine.commands.length - 1];
        let toAutocomplete;
        if (lastCommand.args.length) {
            //if the command has arguments, we should add autocomplete to them
            toAutocomplete = lastCommand.args[lastCommand.args.length - 1];
        } else {
            toAutocomplete = lastCommand.cmd;
        }

        toAutocomplete = expandPath(toAutocomplete, this.shell);

        let fileToMatch;
        let fileBaseDir;
        if (toAutocomplete.endsWith('/')) { //if the last char is slash we want to show all files
            fileToMatch = '';
            fileBaseDir = toAutocomplete;
        } else {
            fileToMatch = path.basename(toAutocomplete);
            fileBaseDir = path.dirname(toAutocomplete);
        }

        let searchDir;
        if (fileBaseDir.startsWith('/') && fs.existsSync(toAutocomplete)) {
            searchDir = toAutocomplete;
        } else {
            searchDir = path.normalize(this.shell.absoluteCwd) === path.normalize(fileBaseDir) ?
                fileBaseDir : path.join(this.shell.absoluteCwd, fileBaseDir.replace(this.shell.absoluteCwd, ''));
        }

        fs.readdir(searchDir, (err, filenames) => {
            if (err) {
                console.log(err);
                return callback(err);
            }
            
            if (fileToMatch === '') {
                return callback(null, [filenames, line]);
            }

            const foundFiles = filenames.filter(filename => {
                return filename.startsWith(fileToMatch);
            });

            if (!foundFiles.length) {
                return callback(null, [], line);
            }

            if (foundFiles.length === 1) {
                const foundFile = foundFiles[0];
                let foundFilePath = expandPath(path.join(fileBaseDir, foundFile), this.shell);
                fs.stat(foundFilePath, (err, stat) => {
                    if (stat && stat.isDirectory()) {
                        foundFilePath += '/';
                    }

                    let correctedLine = line;
                    if (line.includes('~')) {
                        correctedLine = collapsePath(line, this.shell);
                        foundFilePath = collapsePath(foundFilePath, this.shell);
                    }

                    const mergedLineWithResult = this._intersectStrings(correctedLine, foundFilePath);
                    return callback(null, [[mergedLineWithResult], line]);
                });
            } else {
                return callback(null, [foundFiles, line]);
            }
        });
    }
}

module.exports = Completer;