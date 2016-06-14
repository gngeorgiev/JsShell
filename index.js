require('colors');
const domain = require('domain').create();

domain.on('error', err => {
    console.log(err);
    require('fs').writeFileSync('debug.log', err.toString(), 'utf-8');
});

domain.run(() => {
    const shell = require('./src/Shell');
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
                    if (!(err instanceof Error)) {
                        err = new Error(err);
                    }

                    callback(err);
                });
        });

        let params = process.argv.slice(2);
        if (params.length) {
            shell.writeLn(params.join(' '));
        }
    });
});