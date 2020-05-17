import defaultCjs from './default-cjs.js';
import { namedCjs } from './named-cjs.js';
import * as reexported from './reexport.js';
import { esmCjs } from './__esModule-cjs.js';

console.log(defaultCjs);
console.log(namedCjs);
console.log(reexported);
console.log(esmCjs);

window.__commonJs =
  defaultCjs === 'default-cjs' &&
  namedCjs === 'named-cjs' &&
  reexported.defaultCjs === 'default-cjs' &&
  reexported.namedCjs === 'named-cjs' &&
  esmCjs === 'esmCjs';
