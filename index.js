const fs = require('fs')
const path = require('path')
const ndjson = require('fs-ndjson')
const getCallerFile = require('get-caller-file')

const DENY = 0
const ALLOW = 1

const permsFile = path.join(__dirname, 'perms.db')
let perms = []
try {
  perms = ndjson.readFileSync(permsFile)
} catch (err) {
  if (err.code !== 'ENOENT') {
    console.error(err)
    process.exit(1)
  }
}

const append = fs.appendFileSync.bind(fs)
const close = fs.closeSync.bind(fs)
const open = fs.openSync.bind(fs)
const read = fs.readSync.bind(fs)

// https://stackoverflow.com/a/60203932
function prompt(msg) {
  process.stdout.write(msg)

  const fd = open('/dev/tty', 'rs')

  let result = ''
  const buffer = Buffer.alloc(1)

  for (;;) {
    read(fd, buffer, 0, 1)
    // LF \n return on line feed
    if (buffer[0] === 10) {
      break
    }
    // CR \r skip carriage return
    else if (buffer[0] !== 13) {
      result += buffer.toString()
    }
  }

  close(fd)

  return result
}

const isPerm = targetPerm => (targetModule, targetMethod, targetFile) =>
  perms.some(
    ([module, method, perm, file]) =>
      file === targetFile &&
      (module === targetModule || module === '*') &&
      (method === targetMethod || method === '*') &&
      perm === targetPerm
  )
const isDenied = isPerm(DENY)
const isAllowed = isPerm(ALLOW)

;['fs', 'net', 'http', 'https', 'child_process'].forEach(mod => {
  const m = require(mod)

  for (const method in m) {
    const real = m[method]
    if (typeof real !== 'function') continue

    Object.defineProperty(m, method, {
      get: function () {
        const file = getCallerFile(2) ?? getCallerFile(1)
        if (file.startsWith('node:')) return real

        if (isDenied(mod, method, file)) return

        if (!isAllowed(mod, method, file)) {
          const result = prompt(
            file +
              `\n  wants to access "${mod}.${method}". Allow access?\n (n)ot now / neve(r) / n(o)ne from this module\n (y)es only now / (a)lways / all from this (m)odule / al(l) modules always\n> `
          )

          switch (result) {
            case 'n': // not now
              perms.push([mod, method, DENY, file])
              return
            case 'r': // never
              perms.push([mod, method, DENY, file])
              append(permsFile, JSON.stringify(perms.at(-1)) + '\n')
              return
            case 'o': // none from this module
              perms.push([mod, '*', DENY, file])
              append(permsFile, JSON.stringify(perms.at(-1)) + '\n')
              return
            case 'y': // yes only now
              perms.push([mod, method, ALLOW, file])
              break
            case 'a': // always
              perms.push([mod, method, ALLOW, file])
              append(permsFile, JSON.stringify(perms.at(-1)) + '\n')
              break
            case 'm': // all from this module
              perms.push([mod, '*', ALLOW, file])
              append(permsFile, JSON.stringify(perms.at(-1)) + '\n')
              break
            case 'l': // all modules always
              perms.push(['*', '*', ALLOW, file])
              append(permsFile, JSON.stringify(perms.at(-1)) + '\n')
              break
          }
        }

        return real
      }
    })
  }
})
