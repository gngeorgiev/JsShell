const fs = require('fs');
const path = require('path');
const { times } = require('lodash');
const { shell } = require('../utils');

class FileCompleter {
    constructor(shell, searchDir) {
        this.shell = shell;
        this.searchDir = searchDir;
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

    complete(line, fileToMatch, fileBaseDir) {
        return new Promise((resolve, reject) => {
            fs.readdir(this.searchDir, (err, fileNames) => {
                if (err) {
                    console.log(err);
                    return reject(err);
                }

                if (fileToMatch === '') {
                    return resolve(fileNames);
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

                        let correctedLine = line;
                        if (line.includes('~')) {
                            correctedLine = shell.collapsePath(line, this.shell);
                            foundFilePath = shell.collapsePath(foundFilePath, this.shell);
                        }

                        const mergedLineWithResult = this._intersectStrings(correctedLine, foundFilePath);
                        return resolve([mergedLineWithResult]);
                    });
                } else {
                    return resolve(foundFiles);
                }
            });
        });
    }
}

module.exports = FileCompleter;