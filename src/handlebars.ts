import { encodeEntities } from './lib/html.js';
import {
	registerVNodeProcessor,
	registerAttrProcessor,
	registerRawPropProcessor,
	runAttrProcessor
} from './lib/pipeline.js';

export type HandlebarsAttributeResult = [value: any, isHandlebars: boolean];

registerVNodeProcessor((vnode: any): string | null => {
	if (typeof vnode !== 'object' || !vnode?.__handlebars) return null;
	if (vnode.__path) return `{{${vnode.toString()}}}`;
	return vnode.toString();
});

registerAttrProcessor((v: any): [any, boolean] | null => {
	const possibleHandlebars = v || {};
	if (!possibleHandlebars?.__handlebars) return null;
	if (possibleHandlebars?.__expression) return [v.toString(), true];
	if (possibleHandlebars?.__block) return [v.toString(), true];
	return [`{{${v}}}`, true];
});

registerRawPropProcessor((name: string, value: any): string | null => {
	if (name !== '$$') return null;
	return (
		' ' +
		[value]
			.flat()
			.map((e: any) => runAttrProcessor(e)[0])
			.join(' ')
	);
});

/**
 * Serializes a Handlebars vnode to its template string.
 * Returns null if the vnode is not a Handlebars object.
 * @deprecated Use runVNodeProcessors from pipeline instead.
 */
export function serializeHandlebarsVNode(vnode: any): string | null {
	if (typeof vnode !== 'object' || !vnode?.__handlebars) return null;
	if (vnode.__path) return `{{${vnode.toString()}}}`;
	return vnode.toString();
}

/**
 * Serializes a primitive (non-object) vnode.
 * Returns '' for null/undefined/boolean/function, encoded string for strings,
 * stringified value for numbers. Returns null if vnode is an object (caller handles).
 */
export function serializePrimitiveVNode(vnode: any): string | null {
	if (vnode == null || vnode === true || vnode === false) return '';
	const t = typeof vnode;
	if (t === 'object') return null;
	if (t === 'function') return '';
	return t === 'string' ? encodeEntities(vnode) : vnode + '';
}

export const processHandlebarsAttribute = (v: any): HandlebarsAttributeResult => {
	const possibleHandlebars = v || {};
	if (possibleHandlebars?.__handlebars) {
		if (possibleHandlebars?.__expression) {
			return [v.toString(), true];
		} else if (possibleHandlebars?.__block) {
			return [v.toString(), true];
		}
		return [`{{${v}}}`, true];
	}
	return [v, false];
};
