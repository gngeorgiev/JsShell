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

# License

```
The MIT License

Copyright (c) 2010-2016 Google, Inc. http://angularjs.org

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
