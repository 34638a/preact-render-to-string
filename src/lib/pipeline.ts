export type VNodeProcessor = (vnode: any) => string | null;
export type AttrProcessor = (value: any) => [processedValue: any, isRaw: boolean] | null;
export type RawPropProcessor = (name: string, value: any) => string | null;

const _vnodeProcessors: VNodeProcessor[] = [];
const _attrProcessors: AttrProcessor[] = [];
const _rawPropProcessors: RawPropProcessor[] = [];

export function registerVNodeProcessor(fn: VNodeProcessor): void {
	_vnodeProcessors.push(fn);
}

export function registerAttrProcessor(fn: AttrProcessor): void {
	_attrProcessors.push(fn);
}

export function registerRawPropProcessor(fn: RawPropProcessor): void {
	_rawPropProcessors.push(fn);
}

export function runVNodeProcessors(vnode: any): string | null {
	for (let i = 0; i < _vnodeProcessors.length; i++) {
		const result = _vnodeProcessors[i](vnode);
		if (result !== null) return result;
	}
	return null;
}

export function runAttrProcessor(value: any): [any, boolean] {
	for (let i = 0; i < _attrProcessors.length; i++) {
		const result = _attrProcessors[i](value);
		if (result !== null) return result;
	}
	return [value, false];
}

export function runRawPropProcessor(name: string, value: any): string | null {
	for (let i = 0; i < _rawPropProcessors.length; i++) {
		const result = _rawPropProcessors[i](name, value);
		if (result !== null) return result;
	}
	return null;
}
