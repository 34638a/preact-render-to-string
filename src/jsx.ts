import './lib/polyfills.js';
import renderToString from './pretty.js';
import { encodeEntities } from './lib/html.js';
import { indent } from './lib/format.js';
import prettyFormat from 'pretty-format';
import type { VNode } from 'preact';
import type { PrettyRenderOptions } from './pretty.js';

let preactPlugin: any = {
	test(object: unknown) {
		return (
			object &&
			typeof object === 'object' &&
			'type' in (object as object) &&
			'props' in (object as object) &&
			'key' in (object as object)
		);
	},
	print(val: VNode<any>) {
		return renderToString(val, preactPlugin.context, preactPlugin.opts, true);
	}
};

let prettyFormatOpts = {
	plugins: [preactPlugin]
};

function attributeHook(
	name: string,
	value: any,
	context: any,
	opts: PrettyRenderOptions & {
		functions?: boolean;
		functionNames?: boolean;
		skipFalseAttributes?: boolean;
	},
	isComponent: boolean
): string | false {
	let type = typeof value;

	if (name === 'dangerouslySetInnerHTML') return false;

	if (value == null || (type === 'function' && !(opts as any).functions))
		return '';

	if (
		(opts as any).skipFalseAttributes &&
		!isComponent &&
		(value === false ||
			((name === 'class' || name === 'style') && value === ''))
	)
		return '';

	let indentChar = typeof opts.pretty === 'string' ? opts.pretty : '\t';
	if (type !== 'string') {
		if (type === 'function' && !(opts as any).functionNames) {
			value = 'Function';
		} else {
			preactPlugin.context = context;
			preactPlugin.opts = opts;
			value = prettyFormat(value, prettyFormatOpts);
			if (~value.indexOf('\n')) {
				value = `${indent('\n' + value, indentChar)}\n`;
			}
		}
		return indent(`\n${name}={${value}}`, indentChar);
	}
	return `\n${indentChar}${name}="${encodeEntities(value)}"`;
}

let defaultOpts = {
	attributeHook,
	jsx: true,
	xml: false,
	functions: true,
	functionNames: true,
	skipFalseAttributes: true,
	pretty: '  '
};

export default function renderToStringPretty(
	vnode: VNode<any>,
	context?: any,
	options?: PrettyRenderOptions
): string {
	const opts = Object.assign({}, defaultOpts, options || {});
	if (!opts.jsx) (opts as any).attributeHook = null;
	return renderToString(vnode, context, opts);
}
export { renderToStringPretty as render };

const SHALLOW = { shallow: true };

export function shallowRender(
	vnode: VNode<any>,
	context?: any,
	options?: PrettyRenderOptions
): string {
	const opts = Object.assign({}, SHALLOW, options || {});
	return renderToStringPretty(vnode, context, opts);
}
