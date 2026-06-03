export type HandlebarsAttributeResult = [value: any, isHandlebars: boolean];

export const processHandlebarsAttribute = (v: any): HandlebarsAttributeResult => {
	const possibleHandlebars = v || {};
	if (possibleHandlebars?.__handlebars) {
		if (possibleHandlebars?.__expression) {
			return [v.toString(), true];
		} else if (possibleHandlebars?.__block) {
			return [v.toString(), true];
		}
		return [`{{${v}}}`, true];
	}
	return [v, false];
};
