import { html, render } from 'lit-html';

window.__nodeResolve = typeof render === 'function' && typeof html === 'function';
