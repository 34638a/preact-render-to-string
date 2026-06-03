/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

// To modify the INIT_SCRIPT, uncomment the above code, modify it, and paste it into https://try.terser.org/.
const INIT_SCRIPT = `class e extends HTMLElement{connectedCallback(){var e=this;if(!e.isConnected)return;let t=this.getAttribute("data-target");if(t){for(var r,a,i=document.createNodeIterator(document,128);i.nextNode();){let e=i.referenceNode;if(e.data=="$s:"+t?r=e:e.data=="/$s:"+t&&(a=e),r&&a)break}r&&a&&r.parentNode!==document&&requestAnimationFrame((()=>{for(var t=a.previousSibling;t!=r&&t&&t!=r;)a.parentNode.removeChild(t),t=a.previousSibling;for(i=r;e.firstChild;)r=e.firstChild,e.removeChild(r),i.after(r),i=r;e.parentNode.removeChild(e)}))}}}customElements.define("preact-island",e);`;

export function createInitScript(_len?: number): string {
	return `<script>(function(){${INIT_SCRIPT}}())</script>`;
}

export function createSubtree(id: string, content: string): string {
	return `<preact-island hidden data-target="${id}">${content}</preact-island>`;
}
