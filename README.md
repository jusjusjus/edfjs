edfjs
=========

A lean javascript implementation of European Data Format.

## Installation

### Install with npm

To use the library for your website, you can install the npm package:

```bash
npm i edfjs
```

Use it in your javascripts, e.g., with:

```javascript
const fs = require('fs');
const edfjs = require("edfjs");
const edf = new edfjs.EDF();
const fp = fs.readFileSync("./examples/sample.edf");
edf.read_buffer(fp.buffer);
```

### Include module from CDN

The module can be used in your webpage by including the following link from
jsdelivr CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/edfjs@latest/dist/edf.min.js"></script>
```

### Build the module locally

Browserify and Minify is used to build the module as a standalone library so
that you can import it into your own scripts.  To build, git-clone yourself a
local copy of master ``, `cd edfjs`, and build it with npm using `npm run
build`: 

```bash
git clone https://github.com/jusjusjus/edfjs.git
cd edfjs
npm install --only=dev
npm run build
```

A stand-alone version of the library, `./dist/edf.min.js`, should appear.
Before you need to install other dependencies.

## Usage

In `./web`, we give an example usage of edfjs directly included in an html
document.  Build the minified module using `npm run build`, start serving
`./web/index.html` and load an edf file for demo.

## Tests

To test run:

```bash
npm run test
```

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding
style. Add unit tests for any new or changed functionality.  Lint and test your
code.
