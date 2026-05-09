const fs = require('fs');
const path = require('path');

const copy = (filename) => {
	// Copy .module.js --> .mjs for Node 13 compat.
	fs.writeFileSync(
		path.join(process.cwd(), 'dist', `${filename}.mjs`),
		fs.readFileSync(path.join(process.cwd(), 'dist', `${filename}.module.js`))
	);
};

copy('index');
copy('jsx/index');
copy('stream/index');
copy('stream/node/index');
