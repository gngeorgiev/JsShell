const fs = require('fs');
const path = require('path');
const { shell, strings } = require('../utils');

class FileCompleter {
    constructor(shell, searchDir) {
        this.shell = shell;
        this.searchDir = searchDir;
    }

    _toCompleterFileNames(array, line) {
        return (array || [])
            .map(f => shell.escape(f))
            .map(f => strings.intersect(line, f));
    }

    complete(line, fileToMatch, fileBaseDir) {
        return new Promise((resolve, reject) => {
            fs.readdir(this.searchDir, (err, fileNames) => {
                if (err) {
                    if (err.code === 'ENOENT') { //its perfectly fine for a directory to not exist
                        return resolve([]);
                    }

                    console.log(err);
                    return reject(err);
                }

                let correctedLine = line;
                if (line.includes('~')) {
                    correctedLine = shell.collapsePath(line, this.shell);
                }

                if (fileToMatch === '') {
                    const completedFileNames = this._toCompleterFileNames(fileNames, correctedLine);
                    return resolve(completedFileNames);
                }

                const foundFiles = fileNames.filter(filename => {
                    return filename.startsWith(fileToMatch);
                });

                if (foundFiles && !foundFiles.length) {
                    return resolve([]);
                }

                if (foundFiles.length === 1) {
                    const foundFile = foundFiles[0];
                    let foundFilePath = shell.expandPath(path.join(fileBaseDir, foundFile), this.shell);
                    fs.stat(foundFilePath, (err, stat) => {
                        if (stat && stat.isDirectory()) {
                            foundFilePath += '/';
                        }

                        foundFilePath = shell.collapsePath(foundFilePath, this.shell);
                        foundFilePath = shell.escape(foundFilePath);

                        const mergedLineWithResult = strings.intersect(correctedLine, foundFilePath);
                        return resolve([mergedLineWithResult]);
                    });
                } else {
                    return resolve(shell.escape(foundFiles));
                }
            });
        });
    }
}

module.exports = FileCompleter;