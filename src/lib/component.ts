import { DIRTY, BITS } from './constants.js';
import type { VNode } from 'preact';

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
