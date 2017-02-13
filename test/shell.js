const test = require('ava');

const shell = require('../src/shell');

test(t => {
    t.plan(1);

    return new Promise(resolve => {
        shell.onInitialized(() => {
            test('test', t => {
                t.true(shell.initialized);
                resolve();
            });
        });
    });
});