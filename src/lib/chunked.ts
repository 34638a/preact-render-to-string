import { renderToString } from '../index.js';
import { CHILD_DID_SUSPEND, COMPONENT, PARENT } from './constants.js';
import { Deferred } from './util.js';
import { createInitScript, createSubtree } from './client.js';
import type { RendererState, RenderToChunksOptions } from '../internal.js';

export async function renderToChunks(
	vnode: any,
	{ context, onWrite, abortSignal }: RenderToChunksOptions
): Promise<void> {
	context = context || {};

	const renderer: RendererState = {
		start: Date.now(),
		abortSignal,
		onWrite,
		onError: handleError,
		suspended: []
	};

	// @ts-ignore - using third internal RendererState argument
	const shell = renderToString(vnode, context, renderer);

	const len = renderer.suspended.length;
	if (len > 0) {
		const docSuffixIndex = getDocumentClosingTagsIndex(shell);
		const hasHtmlTag = shell.trimStart().startsWith('<html');
		const initialWrite =
			docSuffixIndex !== -1 ? shell.slice(0, docSuffixIndex) : shell;
		const prefix = hasHtmlTag ? '<!DOCTYPE html>' : '';
		onWrite(prefix + initialWrite);
		onWrite('<div hidden>');
		onWrite(createInitScript(len));
		await forkPromises(renderer);
		onWrite('</div>');
		if (docSuffixIndex !== -1) onWrite(shell.slice(docSuffixIndex));
	} else {
		onWrite(shell);
	}
}

function getDocumentClosingTagsIndex(html: string): number {
	return html.lastIndexOf('</body>');
}

async function forkPromises(renderer: RendererState): Promise<void> {
	if (renderer.suspended.length > 0) {
		const suspensions = [...renderer.suspended];
		await Promise.all(renderer.suspended.map((s) => s.promise));
		renderer.suspended = renderer.suspended.filter(
			(s) => !suspensions.includes(s)
		);
		await forkPromises(renderer);
	}
}

function handleError(
	this: RendererState,
	error: any,
	vnode: any,
	renderChild: (child: any, parent?: any) => string
): string | undefined {
	if (!error || !error.then) return;

	while ((vnode = vnode[PARENT])) {
		let component = vnode[COMPONENT];
		if (component && component[CHILD_DID_SUSPEND]) {
			break;
		}
	}

	if (!vnode) return;

	const id = vnode.__v;
	const found = this.suspended.find((x: any) => x.id === id);
	const race = new Deferred<void>();

	const abortSignal = this.abortSignal;
	if (abortSignal) {
		if (abortSignal.aborted) race.resolve();
		else abortSignal.addEventListener('abort', () => race.resolve());
	}

	const promise = error.then(
		() => {
			if (abortSignal && abortSignal.aborted) return;
			const child = renderChild(vnode.props.children, vnode);
			if (child) this.onWrite(createSubtree(id, child));
		},
		this.onError
	);

	this.suspended.push({
		id,
		vnode,
		promise: Promise.race([promise, race.promise])
	});

	const fallback = renderChild(vnode.props.fallback);

	return found ? '' : `<!--$s:${id}-->${fallback}<!--/$s:${id}-->`;
}
