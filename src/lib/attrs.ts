import {
	UNSAFE_NAME,
	NAMESPACE_REPLACE_REGEX,
	SVG_CAMEL_CASE,
	HTML_LOWER_CASE,
	HTML_ENUMERATED
} from './html.js';
import { processHandlebarsAttribute } from '../handlebars.js';
import { isSignal } from './signals.js';

/**
 * Unwrap a Preact signal (if present) then run Handlebars processing.
 * Both renderers do this identically on every prop value.
 */
export function processAttrValue(v: any): [value: any, isHandlebars: boolean] {
	return processHandlebarsAttribute(isSignal(v) ? v.value : v);
}

/**
 * Serialize a `$$` raw-attribute injection value into a string fragment
 * ready to append to the opening tag.
 */
export function serializeRawAttrs(v: any): string {
	return (
		' ' +
		[v]
			.flat()
			.map((e: any) => processHandlebarsAttribute(e)[0])
			.join(' ')
	);
}

/**
 * Returns true when the attribute value must be coerced to a string.
 * Covers enumerated HTML attributes (draggable, spellcheck) and
 * data-* / aria-* (name[4] === '-').
 */
export function isEnumeratedAttr(name: string): boolean {
	return name[4] === '-' || HTML_ENUMERATED.has(name);
}

/**
 * Normalize a JSX prop name to its HTML attribute name.
 * Returns null when the attribute should be skipped entirely.
 *
 * Does NOT handle: children, key, ref, dangerouslySetInnerHTML, style,
 * value/defaultValue (type-dependent side-effects stay in each renderer).
 */
export function resolveAttrName(
	name: string,
	props: Record<string, any>,
	isSvgMode: boolean
): string | null {
	switch (name) {
		case 'htmlFor':
			return 'for' in props ? null : 'for';
		case 'className':
			return 'class' in props ? null : 'class';
		case 'defaultChecked':
			return 'checked';
		case 'defaultSelected':
			return 'selected';
		case 'defaultValue':
			return 'value';
		case 'acceptCharset':
			return 'accept-charset';
		case 'httpEquiv':
			return 'http-equiv';
		default:
			if (NAMESPACE_REPLACE_REGEX.test(name)) {
				return name.replace(NAMESPACE_REPLACE_REGEX, '$1:$2').toLowerCase();
			}
			if (UNSAFE_NAME.test(name)) return null;
			if (isSvgMode) {
				if (SVG_CAMEL_CASE.test(name)) {
					return name === 'panose1'
						? 'panose-1'
						: name.replace(/([A-Z])/g, '-$1').toLowerCase();
				}
				return name;
			}
			if (HTML_LOWER_CASE.test(name)) return name.toLowerCase();
			return name;
	}
}
