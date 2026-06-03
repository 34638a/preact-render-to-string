import { DIRTY, BITS } from './constants.js';
import { VNode } from 'preact';

export const VOID_ELEMENTS =
	/^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;
// oxlint-disable-next-line no-control-regex
export const UNSAFE_NAME = /[\s\n\\/='"\0<>]/;
export const NAMESPACE_REPLACE_REGEX = /^(xlink|xmlns|xml)([A-Z])/;
export const HTML_LOWER_CASE =
	/^(?:accessK|auto[A-Z]|cell|ch|col|cont|cross|dateT|encT|form[A-Z]|frame|hrefL|inputM|maxL|minL|noV|playsI|popoverT|readO|rowS|src[A-Z]|tabI|useM|item[A-Z])/;
export const SVG_CAMEL_CASE =
	/^ac|^ali|arabic|basel|cap|clipPath$|clipRule$|color|dominant|enable|fill|flood|font|glyph[^R]|horiz|image|letter|lighting|marker[^WUH]|overline|panose|pointe|paint|rendering|shape|stop|strikethrough|stroke|text[^L]|transform|underline|unicode|units|^v[^i]|^w|^xH/;

// Boolean DOM properties that translate to enumerated ('true'/'false') attributes
export const HTML_ENUMERATED = new Set(['draggable', 'spellcheck']);

export const COMPONENT_DIRTY_BIT = 1 << 3;

export function setDirty(component: any): void {
	if (component[BITS] !== undefined) {
		component[BITS] |= COMPONENT_DIRTY_BIT;
	} else {
		component[DIRTY] = true;
	}
}

export function unsetDirty(component: any): void {
	if (component.__g !== undefined) {
		component.__g &= ~COMPONENT_DIRTY_BIT;
	} else {
		component[DIRTY] = false;
	}
}

export function isDirty(component: any): boolean {
	if (component.__g !== undefined) {
		return (component.__g & COMPONENT_DIRTY_BIT) !== 0;
	}
	return component[DIRTY] === true;
}

const ENCODED_ENTITIES = /["&<]/;

export function encodeEntities(str: string): string {
	// Skip all work for strings with no entities needing encoding:
	if (str.length === 0 || ENCODED_ENTITIES.test(str) === false) return str;

	let last = 0,
		i = 0,
		out = '',
		ch = '';

	// Seek forward in str until the next entity char:
	for (; i < str.length; i++) {
		switch (str.charCodeAt(i)) {
			case 34:
				ch = '&quot;';
				break;
			case 38:
				ch = '&amp;';
				break;
			case 60:
				ch = '&lt;';
				break;
			default:
				continue;
		}
		if (i !== last) out = out + str.slice(last, i);
		out = out + ch;
		last = i + 1;
	}
	if (i !== last) out = out + str.slice(last, i);
	return out;
}

export let indent = (s: unknown, char?: string): string =>
	String(s).replace(/(\n+)/g, '$1' + (char || '\t'));

export let isLargeString = (
	s: unknown,
	length?: number,
	ignoreLines?: boolean
): boolean =>
	String(s).length > (length || 40) ||
	(!ignoreLines && String(s).indexOf('\n') !== -1) ||
	String(s).indexOf('<') !== -1;

const JS_TO_CSS: Record<string, string> = {};

const IS_NON_DIMENSIONAL = new Set([
	'animation-iteration-count',
	'border-image-outset',
	'border-image-slice',
	'border-image-width',
	'box-flex',
	'box-flex-group',
	'box-ordinal-group',
	'column-count',
	'fill-opacity',
	'flex',
	'flex-grow',
	'flex-negative',
	'flex-order',
	'flex-positive',
	'flex-shrink',
	'flood-opacity',
	'font-weight',
	'grid-column',
	'grid-row',
	'line-clamp',
	'line-height',
	'opacity',
	'order',
	'orphans',
	'stop-opacity',
	'stroke-dasharray',
	'stroke-dashoffset',
	'stroke-miterlimit',
	'stroke-opacity',
	'stroke-width',
	'tab-size',
	'widows',
	'z-index',
	'zoom'
]);

const CSS_REGEX = /[A-Z]/g;

export function styleObjToCss(s: Record<string, unknown>): string | undefined {
	let str = '';
	for (let prop in s) {
		let val = s[prop];
		if (val != null && val !== '') {
			const name =
				prop[0] == '-'
					? prop
					: JS_TO_CSS[prop] ||
						(JS_TO_CSS[prop] = prop.replace(CSS_REGEX, '-$&').toLowerCase());

			let suffix = ';';
			if (
				typeof val === 'number' &&
				!name.startsWith('--') &&
				!IS_NON_DIMENSIONAL.has(name)
			) {
				suffix = 'px;';
			}
			str = str + name + ':' + val + suffix;
		}
	}
	return str || undefined;
}

export function getChildren(accumulator: any[], children: any): any[] {
	if (Array.isArray(children)) {
		children.reduce(getChildren, accumulator);
	} else if (children != null && children !== false) {
		accumulator.push(children);
	}
	return accumulator;
}

function markAsDirty(this: any): void {
	this.__d = true;
}

export function createComponent(vnode: VNode<any>, context: any): any {
	return {
		__v: vnode,
		context,
		props: vnode.props,
		setState: markAsDirty,
		forceUpdate: markAsDirty,
		__d: true,
		// oxlint-disable-next-line no-new-array
		__h: new Array(0)
	};
}

export function getContext(nodeName: any, context: any): any {
	let cxType = nodeName.contextType;
	let provider = cxType && context[cxType.__c];
	return cxType != null
		? provider
			? provider.props.value
			: cxType.__
		: context;
}

export class Deferred<T> {
	promise: Promise<T>;
	resolve!: (value: T | PromiseLike<T>) => void;
	reject!: (reason?: any) => void;

	constructor() {
		this.promise = new Promise<T>((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
		});
	}
}
