* Copy everything from `https://github.com/desktop/desktop/tree/development/app/src/lib/editors` to `./editors`
* Current files are at commit `b500c4d8d7c9e06c960a8e1e0fe08e363c34d4d4`
* Find and replace `__DARWIN__` with `process.platform === 'darwin'`
* Find and replace `__WIN32__` with `process.platform === 'win32'`
* Find and replace `__LINUX__` with `process.platform === 'linux'`
* Add `import log from '../log'` at the top of `darwin.ts`, `lookup.ts`, `win32.ts`. ie, all the files using `log.*` methods
