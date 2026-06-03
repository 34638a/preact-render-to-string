export const VOID_ELEMENTS =
	/^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;
// oxlint-disable-next-line no-control-regex
export const UNSAFE_NAME = /[\s\n\\/='"\0<>]/;
export const NAMESPACE_REPLACE_REGEX = /^(xlink|xmlns|xml)([A-Z])/;
export const HTML_LOWER_CASE =
	/^(?:accessK|auto[A-Z]|cell|ch|col|cont|cross|dateT|encT|form[A-Z]|frame|hrefL|inputM|maxL|minL|noV|playsI|popoverT|readO|rowS|src[A-Z]|tabI|useM|item[A-Z])/;
export const SVG_CAMEL_CASE =
	/^ac|^ali|arabic|basel|cap|clipPath$|clipRule$|color|dominant|enable|fill|flood|font|glyph[^R]|horiz|image|letter|lighting|marker[^WUH]|overline|panose|pointe|paint|rendering|shape|stop|strikethrough|stroke|text[^L]|transform|underline|unicode|units|^v[^i]|^w|^xH/;

export const HTML_ENUMERATED = new Set(['draggable', 'spellcheck']);

export const SELF_CLOSING = new Set([
	'area',
	'base',
	'br',
	'col',
	'command',
	'embed',
	'hr',
	'img',
	'input',
	'keygen',
	'link',
	'meta',
	'param',
	'source',
	'track',
	'wbr'
]);

const ENCODED_ENTITIES = /["&<]/;

export function encodeEntities(str: string): string {
	if (str.length === 0 || ENCODED_ENTITIES.test(str) === false) return str;

	let last = 0,
		i = 0,
		out = '',
		ch = '';

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
