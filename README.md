edfjs
=========

A lean javascript implementation of European Data Format.

## Installation

### Build the module locally

Browserify and Minify is used to build the module as a standalone library so that you can import it into your own scripts.
To build, git-clone yourself a local copy of master ``, `cd edfjs`, and
build it with npm using `npm run build`: 

	git clone https://github.com/jusjusjus/edfjs.git
	cd edfjs
	npm install --only=dev
	npm run build

A stand-alone version of the library should appear in `./dist/edf.min.js`.  Before you need to install other -dependencies.

To include the library into your client-side application use and access the namepace as `edfjs.<..>`

	<script src="./edf.js"></script>
	<script>
	var edffile = edfjs.EDF();
	</script>

## Usage

See [this webpage](https://jusjusjus.github.io/html/edfdataviewer.html) for a client-side deployment.

## Tests

  `npm run test`

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.


