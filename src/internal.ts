import type { ComponentChildren, ComponentChild, VNode } from 'preact';

export interface Suspended {
	id: string;
	promise: Promise<any>;
	vnode: VNode;
}

export interface RendererErrorHandler {
	(
		this: RendererState,
		error: any,
		vnode: VNode<{ fallback: any }>,
		renderChild: (child: ComponentChildren, parent?: ComponentChild) => string
	): string | undefined;
}

export interface RendererState {
	start: number;
	suspended: Suspended[];
	abortSignal?: AbortSignal | undefined;
	onWrite: (str: string) => void;
	onError?: RendererErrorHandler;
}

export interface RenderToChunksOptions {
	context?: any;
	onError?: (error: any) => void;
	onWrite: (str: string) => void;
	abortSignal?: AbortSignal;
}
