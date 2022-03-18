# safe-node

PoC of node with permissions prompts a la deno

## Usage

```sh
# pkg is used to generate node executable
npm i pkg -g

# clone this repo
git clone https://github.com/stagas/safe-node
cd safe-node

# edit the global node_modules path in this file
nano bin.js

# install globally so that safe-node can locate the patch
npm i -g

# generate safe-node executable for your platform
# (edit package.json for target platforms, see pkg docs)
pkg .

# copy actual node as node-real
cp /usr/local/bin/node /usr/local/bin/node-real

# copy safe-node as node
cp safe-node /usr/local/bin/node

# enjoy
node try.js
```

## License

MIT
