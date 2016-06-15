require('colors');
const domain = require('domain').create();
const { error } = require('./src/utils');

domain.on('error', err => {
    console.log(err);
    require('fs').writeFileSync('debug.log', err.toString(), 'utf-8');
});

domain.run(() => {
    const shell = require('./src/shell');
    const Parser = require('./src/Parser');
    const Executor = require('./src/Executor');

    shell.onInitialized(() => {
        const parser = new Parser(shell);
        const executor = new Executor(shell);

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
                    callback(error.wrap(err));
                });
        });

        let params = process.argv.slice(2);
        if (params.length) {
            shell.writeLn(params.join(' '));
        }
    });
});