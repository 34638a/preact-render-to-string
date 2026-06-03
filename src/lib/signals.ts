export function isSignal(x: unknown): boolean {
	return (
		x !== null &&
		typeof x === 'object' &&
		typeof (x as any).peek === 'function' &&
		'value' in (x as object)
	);
}
