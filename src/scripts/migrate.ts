import { readDb } from '../db.js';

await readDb();
console.log('Local prototype schema is ready (data/demo.json).');
