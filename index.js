require('colors');

const shell = require('./src/Shell');
const Parser = require('./src/Parser');
const Executor = require('./src/Executor');
const { noop } = require('lodash');

const parser = new Parser(shell);
const executor = new Executor(shell);

process.on('SIGINT', noop);

shell.onLine((line, callback) => {
    if (!line) {
        return callback();
    }

    const parsedLine = parser.parse(line);
    executor.execute(parsedLine)
        .then(result => {
            callback(result);
        })
        .catch(err => {
            callback(err);
        });
});

let params = process.argv.slice(2);
if (params.length) {
    shell.writeLn(params.join(' '));
}