import { options, h, Fragment } from 'preact';
import type { VNode } from 'preact';
import { CHILDREN, COMMIT, SKIP_EFFECTS } from './constants.js';

export interface RenderPassHandle {
	parent: any;
	previousSkipEffects: any;
	arr: any[];
}

/** Sets up a Preact render pass: disables effects, creates a parent Fragment. */
export function beginRenderPass(vnode: VNode<any>): RenderPassHandle {
	const previousSkipEffects = (options as any)[SKIP_EFFECTS];
	(options as any)[SKIP_EFFECTS] = true;
	const arr: any[] = [];
	const parent = h(Fragment, null);
	(parent as any)[CHILDREN] = [vnode];
	return { parent, previousSkipEffects, arr };
}

/** Tears down a render pass: fires COMMIT, restores SKIP_EFFECTS, resets the arr. */
export function endRenderPass(vnode: VNode<any>, handle: RenderPassHandle): void {
	if ((options as any)[COMMIT]) (options as any)[COMMIT](vnode, handle.arr);
	(options as any)[SKIP_EFFECTS] = handle.previousSkipEffects;
	handle.arr.length = 0;
}
