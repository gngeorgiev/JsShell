require('colors');

const shell = require('./src/Shell');
const Parser = require('./src/Parser');
const Executor = require('./src/Executor');

const parser = new Parser(shell);
const executor = new Executor(shell);

shell.onLine((line, callback) => {
    if (!line) {
        return callback();
    }

    const parsedLine = parser.parse(line);
    executor.execute(parsedLine)
        .then(() => {
            callback();
        })
        .catch(error => {
            console.error(error);
        });
});

let params = process.argv.slice(2);
if (params.length) {
    shell.writeLn(params.join(' '));
}