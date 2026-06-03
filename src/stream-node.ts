import { PassThrough } from 'node:stream';
import { renderToChunks } from './lib/chunked.js';
import type { VNode } from 'preact';
import type { Writable } from 'node:stream';

interface RenderToPipeableStreamOptions {
	onShellReady?: () => void;
	onAllReady?: () => void;
	onError?: (error: any) => void;
}

interface PipeableStream {
	abort: (reason?: unknown) => void;
	pipe: (writable: Writable) => void;
}

export function renderToPipeableStream(
	vnode: VNode<any>,
	options: RenderToPipeableStreamOptions,
	context?: any
): PipeableStream {
	const encoder = new TextEncoder();

	const controller = new AbortController();
	const stream = new PassThrough();

	renderToChunks(vnode, {
		context,
		abortSignal: controller.signal,
		onError: (error) => {
			if (options.onError) {
				options.onError(error);
			}
			controller.abort(error);
		},
		onWrite(s) {
			stream.write(encoder.encode(s));
		}
	})
		.then(() => {
			options.onAllReady && options.onAllReady();
			stream.end();
		})
		.catch((error) => {
			stream.destroy();
			if (options.onError) {
				options.onError(error);
			} else {
				throw error;
			}
		});

	Promise.resolve().then(() => {
		options.onShellReady && options.onShellReady();
	});

	return {
		abort(
			reason: unknown = new Error(
				'The render was aborted by the server without a reason.'
			)
		) {
			if (stream.closed) return;

			controller.abort();
			stream.destroy();
			if (options.onError) {
				options.onError(reason);
			}
		},
		pipe(writable: Writable) {
			stream.pipe(writable, { end: true });
		}
	};
}
