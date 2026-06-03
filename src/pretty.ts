import { encodeEntities, UNSAFE_NAME, VOID_ELEMENTS } from './lib/html.js';
import {
	processAttrValue,
	serializeRawAttrs,
	resolveAttrName,
	isEnumeratedAttr
} from './lib/attrs.js';
import { styleObjToCss } from './lib/css.js';
import {
	createComponent,
	getContext,
	setDirty,
	isDirty,
	unsetDirty
} from './lib/component.js';
import {
	indent,
	isLargeString,
	getChildren,
	getComponentName
} from './lib/format.js';
import { options, Fragment, h } from 'preact';
import {
	COMMIT,
	DIFF,
	DIFFED,
	RENDER,
	SKIP_EFFECTS,
	PARENT,
	CHILDREN
} from './lib/constants.js';
import type { VNode } from 'preact';

const EMPTY_ARR: any[] = [];
const EMPTY_STR = '';
const PRESERVE_WHITESPACE_TAGS = new Set(['pre', 'textarea']);

export interface PrettyRenderOptions {
	pretty?: boolean | string;
	shallow?: boolean;
	xml?: boolean;
	jsx?: boolean;
	functions?: boolean;
	functionNames?: boolean;
	skipFalseAttributes?: boolean;
	sortAttributes?: boolean;
	allAttributes?: boolean;
	renderRootComponent?: boolean;
	shallowHighOrder?: boolean;
	voidElements?: RegExp;
	attributeHook?:
		| ((
				name: string,
				value: any,
				context: any,
				opts: PrettyRenderOptions,
				isComponent: boolean
		  ) => string | false)
		| null
		| undefined;
}

export default function renderToStringPretty(
	vnode: VNode<any>,
	context?: any,
	opts?: PrettyRenderOptions,
	_inner?: boolean
): string {
	const previousSkipEffects = (options as any)[SKIP_EFFECTS];
	(options as any)[SKIP_EFFECTS] = true;

	const parent = h(Fragment, null);
	(parent as any)[CHILDREN] = [vnode];

	try {
		return renderNodePretty(
			vnode,
			context || {},
			opts || {},
			_inner,
			false,
			undefined,
			parent
		);
	} finally {
		if ((options as any)[COMMIT]) (options as any)[COMMIT](vnode, EMPTY_ARR);
		(options as any)[SKIP_EFFECTS] = previousSkipEffects;
		EMPTY_ARR.length = 0;
	}
}

function renderNodePretty(
	vnode: any,
	context: any,
	opts: PrettyRenderOptions,
	inner: boolean | undefined,
	isSvgMode: boolean,
	selectValue: any,
	parent: any
): string {
	if (vnode == null || typeof vnode === 'boolean') {
		return '';
	}

	if ('object' === typeof vnode && vnode?.__handlebars) {
		if (vnode?.__path) {
			return `{{${vnode.toString()}}}`;
		}
		return vnode.toString();
	}

	if (typeof vnode !== 'object') {
		if (typeof vnode === 'function') return '';
		return encodeEntities(vnode + '');
	}

	let pretty = opts.pretty,
		indentChar = pretty && typeof pretty === 'string' ? pretty : '\t';

	if (Array.isArray(vnode)) {
		let rendered = '';
		parent[CHILDREN] = vnode;
		for (let i = 0; i < vnode.length; i++) {
			if (pretty && i > 0) rendered = rendered + '\n';
			rendered =
				rendered +
				renderNodePretty(
					vnode[i],
					context,
					opts,
					inner,
					isSvgMode,
					selectValue,
					parent
				);
		}
		return rendered;
	}

	if (vnode.constructor !== undefined) return '';

	vnode[PARENT] = parent;
	if ((options as any)[DIFF]) (options as any)[DIFF](vnode);

	let nodeName = vnode.type,
		props = vnode.props,
		isComponent = false;

	if (typeof nodeName === 'function') {
		isComponent = true;
		if (
			opts.shallow &&
			(inner || opts.renderRootComponent === false) &&
			nodeName !== Fragment
		) {
			nodeName = getComponentName(nodeName);
		} else if (nodeName === Fragment) {
			const children: any[] = [];
			getChildren(children, vnode.props.children);
			return renderNodePretty(
				children,
				context,
				opts,
				opts.shallowHighOrder !== false,
				isSvgMode,
				selectValue,
				vnode
			);
		} else {
			let rendered: any;

			let c: any = (vnode.__c = createComponent(vnode, context));

			let renderHook = (options as any)[RENDER];

			if (
				!nodeName.prototype ||
				typeof nodeName.prototype.render !== 'function'
			) {
				let cctx = getContext(nodeName, context);

				let count = 0;
				while (isDirty(c) && count++ < 25) {
					unsetDirty(c);

					if (renderHook) renderHook(vnode);

					rendered = nodeName.call(vnode.__c, props, cctx);
				}
			} else {
				let cctx = getContext(nodeName, context);

				c = vnode.__c = new nodeName(props, cctx);
				c.__v = vnode;
				setDirty(c);
				c.props = props;
				if (c.state == null) c.state = {};

				if (c._nextState == null && c.__s == null) {
					c._nextState = c.__s = c.state;
				}

				c.context = cctx;
				if (nodeName.getDerivedStateFromProps)
					c.state = Object.assign(
						{},
						c.state,
						nodeName.getDerivedStateFromProps(c.props, c.state)
					);
				else if (c.componentWillMount) {
					c.componentWillMount();

					c.state =
						c._nextState !== c.state
							? c._nextState
							: c.__s !== c.state
								? c.__s
								: c.state;
				}

				if (renderHook) renderHook(vnode);

				rendered = c.render(c.props, c.state, c.context);
			}

			if (c.getChildContext) {
				context = Object.assign({}, context, c.getChildContext());
			}

			const res = renderNodePretty(
				rendered,
				context,
				opts,
				opts.shallowHighOrder !== false,
				isSvgMode,
				selectValue,
				vnode
			);

			if ((options as any)[DIFFED]) (options as any)[DIFFED](vnode);

			return res;
		}
	}

	let s = '<' + nodeName,
		propChildren: any,
		html: string | undefined;

	const shouldPreserveWhitespace =
		pretty &&
		typeof nodeName === 'string' &&
		PRESERVE_WHITESPACE_TAGS.has(nodeName);

	if (props) {
		let attrs = Object.keys(props);

		if (opts && opts.sortAttributes === true) attrs.sort();

		for (let i = 0; i < attrs.length; i++) {
			let name = attrs[i],
				v = props[name];

			const [attrVal, isHandlebars] = processAttrValue(v);
			v = attrVal;

			if (name === '$$') {
				s += serializeRawAttrs(v);
				continue;
			}

			if (name === 'children') {
				propChildren = v;
				continue;
			}

			if (
				!(opts && opts.allAttributes) &&
				(name === 'key' ||
					name === 'ref' ||
					name === '__self' ||
					name === '__source')
			)
				continue;

			{
				const resolved = resolveAttrName(name, props, isSvgMode);
				if (resolved === null) continue;
				name = resolved;
				if (isEnumeratedAttr(name) && v != null) v = v + EMPTY_STR;
			}

			if (name === 'style' && v && typeof v === 'object') {
				v = styleObjToCss(v);
			}

			if (name[0] === 'a' && name[1] === 'r' && typeof v === 'boolean') {
				v = String(v);
			}

			let hooked =
				opts.attributeHook &&
				opts.attributeHook(name, v, context, opts, isComponent);
			if (hooked || hooked === '') {
				s = s + hooked;
				continue;
			}

			if (name === 'dangerouslySetInnerHTML') {
				html = v && v.__html;
			} else if (nodeName === 'textarea' && name === 'value') {
				propChildren = v;
			} else if ((v || v === 0 || v === '') && typeof v !== 'function') {
				if (v === true || v === '') {
					v = name;
					if (!opts || !opts.xml) {
						s = s + ' ' + name;
						continue;
					}
				}

				if (name === 'value') {
					if (nodeName === 'select') {
						selectValue = v;
						continue;
					} else if (
						nodeName === 'option' &&
						selectValue == v &&
						typeof props.selected === 'undefined'
					) {
						s = s + ` selected`;
					}
				}
				s = s + ` ${name}="${isHandlebars ? v : encodeEntities(v + '')}"`;
			}
		}
	}

	if (pretty) {
		let sub = s.replace(/\n\s*/, ' ');
		if (sub !== s && !~sub.indexOf('\n')) s = sub;
		else if (pretty && ~s.indexOf('\n')) s = s + '\n';
	}

	s = s + '>';

	if (UNSAFE_NAME.test(nodeName))
		throw new Error(`${nodeName} is not a valid HTML tag name in ${s}`);

	let isVoid =
		VOID_ELEMENTS.test(nodeName) ||
		(opts.voidElements ? opts.voidElements.test(nodeName) : false);
	let pieces: string[] = [];

	let children: any[] | undefined;
	if (html) {
		if (pretty && !shouldPreserveWhitespace && isLargeString(html)) {
			html = '\n' + indentChar + indent(html, indentChar as string);
		}
		s = s + html;
	} else if (
		propChildren != null &&
		getChildren((children = []), propChildren).length
	) {
		const shouldPrettyFormatChildren =
			pretty && !shouldPreserveWhitespace && typeof nodeName === 'string';
		let hasLarge: boolean | number = shouldPrettyFormatChildren
			? ~s.indexOf('\n')
			: 0;
		let lastWasText = false;

		for (let i = 0; i < children!.length; i++) {
			let child = children![i];

			if (child != null && child !== false) {
				let childSvgMode =
						nodeName === 'svg'
							? true
							: nodeName === 'foreignObject'
								? false
								: isSvgMode,
					ret = renderNodePretty(
						child,
						context,
						opts,
						true,
						childSvgMode,
						selectValue,
						vnode
					);

				if (shouldPrettyFormatChildren && !hasLarge && isLargeString(ret))
					hasLarge = true;

				if (ret) {
					if (shouldPrettyFormatChildren) {
						let isText = ret.length > 0 && ret[0] != '<';

						if (lastWasText && isText) {
							pieces[pieces.length - 1] += ret;
						} else {
							pieces.push(ret);
						}

						lastWasText = isText;
					} else {
						pieces.push(ret);
					}
				}
			}
		}
		if (shouldPrettyFormatChildren && hasLarge) {
			for (let i = pieces.length; i--; ) {
				pieces[i] =
					'\n' + indentChar + indent(pieces[i], indentChar as string);
			}
		}
	}

	if ((options as any)[DIFFED]) (options as any)[DIFFED](vnode);

	if (pieces.length || html) {
		s = s + pieces.join('');
	} else if (opts && opts.xml) {
		return s.substring(0, s.length - 1) + ' />';
	}

	if (isVoid && !children && !html) {
		s = s.replace(/>$/, ' />');
	} else {
		if (pretty && !shouldPreserveWhitespace && ~s.indexOf('\n')) s = s + '\n';
		s = s + `</${nodeName}>`;
	}

	return s;
}
