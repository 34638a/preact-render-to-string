const path = require('path');
const assert = require('assert/strict');
const { pathToFileURL } = require('url');

const filePath = (file) => path.join(process.cwd(), 'dist', file);
const fileURL = (file) => pathToFileURL(filePath(file)).href;

// Main CJS
const mainCjs = require(filePath('index.js'));
assert(typeof mainCjs === 'function');
assert(typeof mainCjs.renderToString === 'function');
assert(typeof mainCjs.renderToStaticMarkup === 'function');
assert(typeof mainCjs.render === 'function');

// Main ESM
(async () => {
	const mainESM = await import(fileURL('index.mjs'));
	assert(typeof mainESM.default === 'function');
	assert(typeof mainESM.renderToString === 'function');
	assert(typeof mainESM.renderToStaticMarkup === 'function');
	assert(typeof mainESM.render === 'function');
})();

// JSX CJS
const jsxCjs = require(filePath('jsx/index.js'));
assert(typeof jsxCjs === 'function');
assert(typeof jsxCjs.render === 'function');
assert(typeof jsxCjs.shallowRender === 'function');

// JSX ESM
(async () => {
	const jsxESM = await import(fileURL('jsx/index.mjs'));
	assert(typeof jsxESM.default === 'function');
	assert(typeof jsxESM.render === 'function');
	assert(typeof jsxESM.shallowRender === 'function');
})();
