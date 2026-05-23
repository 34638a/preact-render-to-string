

/**
 * Process a Handlebars Attribute.
 * @param v
 * @returns {string|*}
 */
export const processHandlebarsAttribute = (v) => {

	const possibleHandlebars = (v || {});
	if (possibleHandlebars?.__handlebars) { // is handlebars
		if (possibleHandlebars?.__expression) {
			return v.toString();
		} else if (possibleHandlebars?.__block) {
			return v.toString();
		}
		return `{{${v}}}`
	}
	return v;
}

