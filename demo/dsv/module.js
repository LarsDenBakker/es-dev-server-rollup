import fruit from './fruit.csv';

window.__dsv = fruit.length === 3 && fruit[0].type === 'apples';
