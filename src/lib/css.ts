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
