require('colors');
const domain = require('domain').create();
const { error } = require('./src/utils');

let shell;
domain.on('error', err => {
    shell.exit(1, err);
});

process.on('uncaughtException', err => {
    shell.exit(1, err);
});

domain.run(() => {
    shell = require('./src/shell');
    const Parser = require('./src/Parser');
    const Executor = require('./src/Executor');

    shell.onInitialized(() => {
        const parser = new Parser(shell);
        const executor = new Executor(shell);

        shell.onLine(async (line, callback) => {
            if (!line) {
                return callback();
            }

            const parsedLine = parser.parse(line);
            try {
                const result = await executor.execute(parsedLine);
                return callback(result);
            } catch (err) {
                return callback(error.wrap(err));
            }
        });

        let params = process.argv.slice(2);
        if (params.length) {
            shell.writeLn(params.join(' '));
        }
    });
});