

/**
 * Process a Handlebars Attribute.
 * @param v
 * @returns {string|*}
 */
export const processHandlebarsAttribute = (v) => {

	const possibleHandlebars = (v || {});
	if (possibleHandlebars?.__handlebars) { // is handlebars
		// console.log(possibleHandlebars);
		if (possibleHandlebars?.__expression) {
			// console.log("is expression");
			return [v.toString(), true];
		} else if (possibleHandlebars?.__block) {
			// console.log("is block");
			return [v.toString(), true];
		}
		// console.log("is variable");
		return [`{{${v}}}`, true]
	}
	return [v, false];
}

/**
 * Take a vNode from the tree and if it is handlebars render it.
 * @param vNode
 */
// export const processHandlebarsVNode = (vNode) => {
// 	return
// }
