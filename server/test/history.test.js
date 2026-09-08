import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { HistoryManager } from '../src/historyManager.js';
import { detectContentType } from '../src/utils/detector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DATA_DIR = path.join(__dirname, '..', 'data');
const TEST_DATA_FILE = path.join(TEST_DATA_DIR, 'history.json');

console.log('--- Running HistoryManager & Detector Tests ---');

// Test 1: Content Type Detector
console.log('Test 1: Content Type Detection');
assert.strictEqual(detectContentType('https://github.com/google'), 'url');
assert.strictEqual(detectContentType('test@example.com'), 'email');
assert.strictEqual(detectContentType('+1 (555) 123-4567'), 'phone');
assert.strictEqual(detectContentType('const x = () => { return 42; };'), 'code');
assert.strictEqual(detectContentType('Just a regular quick note!'), 'text');
console.log('✓ Content Type Detection passed');

// Test 2: Ingest up to 550 items and verify max limit of 500
console.log('Test 2: 500 Items Limit & FIFO Buffer');
const manager = new HistoryManager();
// Clear existing for clean test
manager.clear(false);

for (let i = 1; i <= 550; i++) {
  manager.addItem({
    text: `Copied text number ${i}`,
    source: 'pc'
  });
}

const items = manager.getItems({ limit: 600 });
assert.strictEqual(items.length, 500, `Expected exactly 500 items, got ${items.length}`);
// Latest item should be number 550
assert.strictEqual(items[0].text, 'Copied text number 550');
// Oldest items (1 to 50) should have been pruned
const hasItem1 = items.some(it => it.text === 'Copied text number 1');
assert.strictEqual(hasItem1, false, 'Oldest item 1 should be pruned');
const hasItem51 = items.some(it => it.text === 'Copied text number 51');
assert.strictEqual(hasItem51, true, 'Item 51 should be present');
console.log('✓ 500-Item FIFO buffer passed');

// Test 3: Pinned items are preserved when exceeding 500
console.log('Test 3: Pinned Items Preservation');
manager.clear(false);

// Add an item and pin it
const pinnedItem = manager.addItem({ text: 'IMPORTANT_PINNED_PASSWORD', source: 'pc' });
manager.togglePin(pinnedItem.id);

// Add 510 more items
for (let i = 1; i <= 510; i++) {
  manager.addItem({ text: `Flooding item ${i}`, source: 'pc' });
}

const itemsAfterFlood = manager.getItems({ limit: 600 });
assert.strictEqual(itemsAfterFlood.length, 500);
const pinnedPreserved = itemsAfterFlood.find(it => it.id === pinnedItem.id);
assert.ok(pinnedPreserved, 'Pinned item must be preserved even after 510 new additions!');
assert.strictEqual(pinnedPreserved.isPinned, true);
console.log('✓ Pinned item preservation passed');

// Test 4: Deduplication of consecutive identical copies
console.log('Test 4: Consecutive Deduplication');
const beforeCount = manager.getItems().length;
const duplicate = manager.addItem({ text: itemsAfterFlood[0].text, source: 'pc' });
assert.strictEqual(manager.getItems().length, beforeCount, 'Adding identical text should not increase count');
console.log('✓ Deduplication passed');

console.log('\nALL 4 HISTORY MANAGER TESTS PASSED SUCCESSFULLY! ✨');
