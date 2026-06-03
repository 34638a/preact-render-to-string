import { encodeEntities, SELF_CLOSING, UNSAFE_NAME } from './html.js';
import { styleObjToCss } from './css.js';
import {
	createComponent,
	setDirty,
	unsetDirty,
	isDirty
} from './component.js';
import {
	processAttrValue,
	resolveAttrName,
	isEnumeratedAttr
} from './attrs.js';
import { serializePrimitiveVNode } from '../handlebars.js';
import { runVNodeProcessors, runRawPropProcessor } from './pipeline.js';
import { options, Fragment } from 'preact';
import { beginRenderPass, endRenderPass } from './render-setup.js';
import {
	CHILDREN,
	COMPONENT,
	DIFF,
	DIFFED,
	NEXT_STATE,
	PARENT,
	RENDER,
	VNODE,
	CATCH_ERROR
} from './constants.js';
import type { VNode } from 'preact';
import type { RendererState } from '../internal.js';

const EMPTY_OBJ: Record<string, never> = {};
const isArray = Array.isArray;
const assign = Object.assign;
const EMPTY_STR = '';
const BEGIN_SUSPENSE_DENOMINATOR = '<!--$s-->';
const END_SUSPENSE_DENOMINATOR = '<!--/$s-->';

function wrapWithSuspenseMarkers(
	result: string | any[] | Promise<any>
): string | any[] | Promise<any> {
	if (typeof result === 'string') {
		return BEGIN_SUSPENSE_DENOMINATOR + result + END_SUSPENSE_DENOMINATOR;
	} else if (isArray(result)) {
		result.unshift(BEGIN_SUSPENSE_DENOMINATOR);
		result.push(END_SUSPENSE_DENOMINATOR);
		return result;
	} else if (result && typeof (result as any).then === 'function') {
		return (result as Promise<any>).then(wrapWithSuspenseMarkers);
	}
	return BEGIN_SUSPENSE_DENOMINATOR + result + END_SUSPENSE_DENOMINATOR;
}

// Preact options hooks captured once per synchronous render pass
let beforeDiff: any, afterDiff: any, renderHook: any, ummountHook: any;



export function renderToString(
	vnode: VNode<any>,
	context?: any,
	_rendererState?: RendererState
): string {
	const pass = beginRenderPass(vnode);

	beforeDiff = (options as any)[DIFF];
	afterDiff = (options as any)[DIFFED];
	renderHook = (options as any)[RENDER];
	ummountHook = (options as any).unmount;

	try {
		const rendered = _renderToString(
			vnode,
			context || EMPTY_OBJ,
			false,
			undefined,
			pass.parent,
			false,
			_rendererState
		);

		if (isArray(rendered)) {
			return (rendered as any[]).join(EMPTY_STR);
		}
		return rendered as string;
	} catch (e: any) {
		if (e.then) {
			throw new Error('Use "renderToStringAsync" for suspenseful rendering.');
		}
		throw e;
	} finally {
		endRenderPass(vnode, pass);
	}
}

export async function renderToStringAsync(
	vnode: VNode<any>,
	context?: any
): Promise<string> {
	const pass = beginRenderPass(vnode);

	beforeDiff = (options as any)[DIFF];
	afterDiff = (options as any)[DIFFED];
	renderHook = (options as any)[RENDER];
	ummountHook = (options as any).unmount;

	try {
		const rendered = await _renderToString(
			vnode,
			context || EMPTY_OBJ,
			false,
			undefined,
			pass.parent,
			true,
			undefined
		);

		if (isArray(rendered)) {
			let count = 0;
			let resolved: any[] = rendered as any[];

			while (
				resolved.some(
					(element) => element && typeof element.then === 'function'
				) &&
				count++ < 25
			) {
				resolved = (await Promise.all(resolved)).flat();
			}

			return resolved.join(EMPTY_STR);
		}

		return rendered as string;
	} finally {
		endRenderPass(vnode, pass);
	}
}

function renderClassComponent(vnode: VNode<any>, context: any): any {
	let type = vnode.type as any;

	let isMounting = true;
	let c: any;
	if ((vnode as any)[COMPONENT]) {
		isMounting = false;
		c = (vnode as any)[COMPONENT];
		c.state = c[NEXT_STATE];
	} else {
		c = new type(vnode.props, context);
	}

	(vnode as any)[COMPONENT] = c;
	c[VNODE] = vnode;

	c.props = vnode.props;
	c.context = context;

	setDirty(c);

	if (c.state == null) c.state = EMPTY_OBJ;

	if (c[NEXT_STATE] == null) {
		c[NEXT_STATE] = c.state;
	}

	if (type.getDerivedStateFromProps) {
		c.state = assign(
			{},
			c.state,
			type.getDerivedStateFromProps(c.props, c.state)
		);
	} else if (isMounting && c.componentWillMount) {
		c.componentWillMount();
		c.state = c[NEXT_STATE] !== c.state ? c[NEXT_STATE] : c.state;
	} else if (!isMounting && c.componentWillUpdate) {
		c.componentWillUpdate();
	}

	if (renderHook) renderHook(vnode);

	return c.render(c.props, c.state, context);
}

export function _renderToString(
	vnode: any,
	context: any,
	isSvgMode: boolean,
	selectValue: any,
	parent: any,
	asyncMode: boolean,
	renderer?: RendererState
): string | Promise<string> | (string | Promise<string>)[] {
	{
		const prim = serializePrimitiveVNode(vnode);
		if (prim !== null) return prim;
	}

	if ('object' === typeof vnode) {
		const hbs = runVNodeProcessors(vnode);
		if (hbs !== null) return hbs;
	}

	if (isArray(vnode)) {
		let rendered: string = EMPTY_STR,
			renderArray: any[] | undefined;
		parent[CHILDREN] = vnode;
		const vnodeLength = vnode.length;
		for (let i = 0; i < vnodeLength; i++) {
			let child = vnode[i];
			if (child == null || typeof child == 'boolean') continue;

			const childRender = _renderToString(
				child,
				context,
				isSvgMode,
				selectValue,
				parent,
				asyncMode,
				renderer
			);

			if (typeof childRender == 'string') {
				rendered = rendered + childRender;
			} else {
				if (!renderArray) {
					// oxlint-disable-next-line no-new-array
					renderArray = new Array(vnodeLength);
				}

				if (rendered) renderArray.push(rendered);

				rendered = EMPTY_STR;

				if (isArray(childRender)) {
					renderArray.push(...childRender);
				} else {
					renderArray.push(childRender);
				}
			}
		}

		if (renderArray) {
			if (rendered) renderArray.push(rendered);
			return renderArray;
		}

		return rendered;
	}

	if (vnode.constructor !== undefined) return EMPTY_STR;

	vnode[PARENT] = parent;
	if (beforeDiff) beforeDiff(vnode);

	let type = vnode.type,
		props = vnode.props;

	if (typeof type == 'function') {
		let cctx = context,
			contextType: any,
			rendered: any,
			component: any;
		if (type === Fragment) {
			if ('tpl' in props) {
				let out = EMPTY_STR;
				for (let i = 0; i < props.tpl.length; i++) {
					out = out + props.tpl[i];

					if (props.exprs && i < props.exprs.length) {
						const value = props.exprs[i];
						if (value == null) continue;

						if (
							typeof value == 'object' &&
							(value.constructor === undefined || isArray(value))
						) {
							out =
								out +
								_renderToString(
									value,
									context,
									isSvgMode,
									selectValue,
									vnode,
									asyncMode,
									renderer
								);
						} else {
							out = out + value;
						}
					}
				}

				return out;
			} else if ('UNSTABLE_comment' in props) {
				return '<!--' + encodeEntities(props.UNSTABLE_comment) + '-->';
			}

			rendered = props.children;
		} else {
			contextType = type.contextType;
			if (contextType != null) {
				let provider = context[contextType.__c];
				cctx = provider ? provider.props.value : contextType.__;
			}

			let isClassComponent =
				type.prototype && typeof type.prototype.render == 'function';
			if (isClassComponent) {
				rendered = /**#__NOINLINE__**/ renderClassComponent(vnode, cctx);
				component = vnode[COMPONENT];
			} else {
				vnode[COMPONENT] = component = /**#__NOINLINE__**/ createComponent(
					vnode,
					cctx
				);

				let count = 0;
				while (isDirty(component) && count++ < 25) {
					unsetDirty(component);

					if (renderHook) renderHook(vnode);

					try {
						rendered = type.call(component, props, cctx);
					} catch (error: any) {
						if (asyncMode && error && typeof error.then == 'function') {
							vnode._suspended = true;
						}

						throw error;
					}
				}

				setDirty(component);
			}

			if (component.getChildContext != null) {
				context = assign({}, context, component.getChildContext());
			}

			if (
				isClassComponent &&
				(options as any).errorBoundaries &&
				(type.getDerivedStateFromError || component.componentDidCatch)
			) {
				let isTopLevelFragment =
					rendered != null &&
					rendered.type === Fragment &&
					rendered.key == null &&
					rendered.props.tpl == null;
				rendered = isTopLevelFragment ? rendered.props.children : rendered;

				try {
					return _renderToString(
						rendered,
						context,
						isSvgMode,
						selectValue,
						vnode,
						asyncMode,
						renderer
					);
				} catch (err: any) {
					if (type.getDerivedStateFromError) {
						component[NEXT_STATE] = type.getDerivedStateFromError(err);
					}

					if (component.componentDidCatch) {
						component.componentDidCatch(err, EMPTY_OBJ);
					}

					if (isDirty(component)) {
						rendered = renderClassComponent(vnode, context);
						component = vnode[COMPONENT];

						if (component.getChildContext != null) {
							context = assign({}, context, component.getChildContext());
						}

						let isTopLevelFragment =
							rendered != null &&
							rendered.type === Fragment &&
							rendered.key == null &&
							rendered.props.tpl == null;
						rendered = isTopLevelFragment ? rendered.props.children : rendered;

						return _renderToString(
							rendered,
							context,
							isSvgMode,
							selectValue,
							vnode,
							asyncMode,
							renderer
						);
					}

					return EMPTY_STR;
				} finally {
					if (afterDiff) afterDiff(vnode);
					if (ummountHook) ummountHook(vnode);
				}
			}
		}

		let isTopLevelFragment =
			rendered != null &&
			rendered.type === Fragment &&
			rendered.key == null &&
			rendered.props.tpl == null;
		rendered = isTopLevelFragment ? rendered.props.children : rendered;

		try {
			const str = _renderToString(
				rendered,
				context,
				isSvgMode,
				selectValue,
				vnode,
				asyncMode,
				renderer
			);

			if (afterDiff) afterDiff(vnode);

			if ((options as any).unmount) (options as any).unmount(vnode);

			if (vnode._suspended) {
				return wrapWithSuspenseMarkers(str as any);
			}

			return str;
		} catch (error: any) {
			if (!asyncMode && renderer && renderer.onError) {
				const onError = (error: any): any => {
					return renderer.onError!.call(
						renderer,
						error,
						vnode,
						(child: any, parent: any) => {
							try {
								return _renderToString(
									child,
									context,
									isSvgMode,
									selectValue,
									parent,
									asyncMode,
									renderer
								) as string;
							} catch (e) {
								return onError(e);
							}
						}
					);
				};
				let res = onError(error);

				if (res !== undefined) return res;

				let errorHook = (options as any)[CATCH_ERROR];
				if (errorHook) errorHook(error, vnode);
				return EMPTY_STR;
			}

			if (!asyncMode) throw error;

			if (!error || typeof error.then != 'function') throw error;

			const renderNestedChildren = (): any => {
				try {
					const result = _renderToString(
						rendered,
						context,
						isSvgMode,
						selectValue,
						vnode,
						asyncMode,
						renderer
					);
					return vnode._suspended
						? wrapWithSuspenseMarkers(result as any)
						: result;
				} catch (e: any) {
					if (!e || typeof e.then != 'function') throw e;

					return e.then(renderNestedChildren);
				}
			};

			return error.then(renderNestedChildren);
		}
	}

	// Serialize Element VNodes to HTML
	let s = '<' + type,
		html: any = EMPTY_STR,
		children: any;

	for (let name in props) {
		let v = props[name];
		const [attrVal, isHandlebars] = processAttrValue(v);
		v = attrVal;

		if (typeof v == 'function' && name !== 'class' && name !== 'className') {
			continue;
		}

		{
			const raw = runRawPropProcessor(name, v);
			if (raw !== null) { s += raw; continue; }
		}

		switch (name) {

			case 'children':
				children = v;
				continue;

			case 'key':
			case 'ref':
			case '__self':
			case '__source':
				continue;

			case 'defaultValue':
			case 'value':
				name = 'value';
				switch (type) {
					case 'textarea':
						children = v;
						continue;
					case 'select':
						selectValue = v;
						continue;
					case 'option':
						if (selectValue == v && !('selected' in props)) {
							s = s + ' selected';
						}
						break;
				}
				break;

			case 'dangerouslySetInnerHTML':
				html = v && v.__html;
				continue;

			case 'style':
				if (typeof v === 'object') {
					v = styleObjToCss(v);
				}
				break;

			default: {
				const resolved = resolveAttrName(name, props, isSvgMode);
				if (resolved === null) continue;
				name = resolved;
				if (isEnumeratedAttr(name) && v != null) v = v + EMPTY_STR;
			}
		}

		if (v != null && v !== false) {
			if (v === true || v === EMPTY_STR) {
				s = s + ' ' + name;
			} else {
				s =
					s +
					' ' +
					name +
					'="' +
					(typeof v == 'string'
						? isHandlebars
							? v
							: encodeEntities(v)
						: v + EMPTY_STR) +
					'"';
			}
		}
	}

	if (UNSAFE_NAME.test(type)) {
		throw new Error(`${type} is not a valid HTML tag name in ${s}>`);
	}

	if (html) {
		// dangerouslySetInnerHTML
	} else if (typeof children === 'string') {
		html = encodeEntities(children);
	} else if (children != null && children !== false && children !== true) {
		let childSvgMode =
			type === 'svg' || (type !== 'foreignObject' && isSvgMode);
		html = _renderToString(
			children,
			context,
			childSvgMode,
			selectValue,
			vnode,
			asyncMode,
			renderer
		) as string;
	}

	if (afterDiff) afterDiff(vnode);
	if (ummountHook) ummountHook(vnode);

	if (!html && SELF_CLOSING.has(type)) {
		return s + '/>';
	}

	const endTag = '</' + type + '>';
	const startTag = s + '>';

	if (isArray(html)) return [startTag, ...(html as any[]), endTag];
	else if (typeof html != 'string') return [startTag, html, endTag];
	return startTag + html + endTag;
}
