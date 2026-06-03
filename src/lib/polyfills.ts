if (typeof Symbol !== 'function') {
	let c = 0;
	// oxlint-disable-next-line no-global-assign
	(Symbol as unknown) = function (s: string) {
		return `@@${s}${++c}`;
	};
	(Symbol as unknown as { for: (s: string) => string }).for = (s: string) =>
		`@@${s}`;
}
