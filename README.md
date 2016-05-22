# JShell - WIP

JShell is a JavaScript based unix shell that allows you to execute unix commands and JavaScript code directly in your terminal.
The configs and scripts are also pure JavaScript, bye bye long and ugly `.bashrc`.

# Demo

[![asciicast](https://asciinema.org/a/85cb90nucuaof2k3is4zeoezm.png)](https://asciinema.org/a/85cb90nucuaof2k3is4zeoezm)

# Example configuration file

```javascript
const fs = require('fs');
const path = require('path');

module.exports = function (shell) {
    return {
        prompt: () => {
            const time = new Date().toLocaleTimeString().green;
            const cwd = shell.cwd.cyan;
            const sign = '$'.yellow;

            const isGitRepo = fs.existsSync(path.join(shell.absoluteCwd, '.git'));
            let gitBranch = isGitRepo ? shell.exec('git rev-parse --abbrev-ref HEAD').trim() : 'not a repo';
            gitBranch = ('{' + gitBranch + '}').red;

            return `${time} ${cwd} ${gitBranch} ${sign} `;
        }
    }
};
```

# Features completion

- [X] Execute unix commands
- [X] Configuration file
  - [X] - Prompt
  - [X] - Env
  - [ ] - Others?
- [X] Autocomplete based on files
- [ ] Autocomplete from bash completion files
- [ ] Execute JavaScript inside the shell
- [X] Multiple commands - `&&`
- [ ] Pipes - `|`
- [ ] Background processes - `&`
- [ ] More?

# Installation 

*To be done*

# Local development

* Clone the repo
* Run the shell with `node index.js`
* For debugging run with `node --debug=5858 index.js` and attach a remote node debugger
* There are no tests just yet, but stay tuned for those

# Contributing

* Fork the repo
* Clone it
* Commit your changes
* Submit PR

Make sure to keep the code style the same.
