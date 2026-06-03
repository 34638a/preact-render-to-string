import { Deferred } from './lib/util.js';
import { renderToChunks } from './lib/chunked.js';
import type { VNode } from 'preact';

type RenderStream = ReadableStream<Uint8Array> & { allReady: Promise<void> };

export function renderToReadableStream(
	vnode: VNode<any>,
	context?: any
): RenderStream {
	const allReady = new Deferred<void>();
	const encoder = new TextEncoder();

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			renderToChunks(vnode, {
				context,
				onError: (error) => {
					allReady.reject(error);
					controller.error(error);
				},
				onWrite(s) {
					controller.enqueue(encoder.encode(s));
				}
			})
				.then(() => {
					controller.close();
					allReady.resolve();
				})
				.catch((error) => {
					controller.error(error);
					allReady.reject(error);
				});
		}
	}) as RenderStream;

	stream.allReady = allReady.promise;

	return stream;
}
