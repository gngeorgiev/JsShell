module.exports = function (shell) {
    return {
        prompt: () => {
            return `${new Date().toLocaleTimeString()}`.green +
                ` ${shell.cwd}`.cyan +
                ` $ `.red;
        }
    }
};