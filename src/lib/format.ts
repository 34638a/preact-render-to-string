export function indent(s: unknown, char?: string): string {
	return String(s).replace(/(\n+)/g, '$1' + (char || '\t'));
}

export function isLargeString(
	s: unknown,
	length?: number,
	ignoreLines?: boolean
): boolean {
	return (
		String(s).length > (length || 40) ||
		(!ignoreLines && String(s).indexOf('\n') !== -1) ||
		String(s).indexOf('<') !== -1
	);
}

export function getChildren(accumulator: any[], children: any): any[] {
	if (Array.isArray(children)) {
		children.reduce(getChildren, accumulator);
	} else if (children != null && children !== false) {
		accumulator.push(children);
	}
	return accumulator;
}

const UNNAMED: any[] = [];

export function getComponentName(component: any): string {
	return (
		component.displayName ||
		(component !== Function && component.name) ||
		getFallbackComponentName(component)
	);
}

function getFallbackComponentName(component: any): string {
	let str = Function.prototype.toString.call(component),
		name = (str.match(/^\s*function\s+([^( ]+)/) || '')[1];
	if (!name) {
		let index = -1;
		for (let i = UNNAMED.length; i--; ) {
			if (UNNAMED[i] === component) {
				index = i;
				break;
			}
		}
		if (index < 0) {
			index = UNNAMED.push(component) - 1;
		}
		name = `UnnamedComponent${index}`;
	}
	return name;
}
