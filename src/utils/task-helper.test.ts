/**
 * Tests for Task Helper Utilities
 * 
 * Uses Node.js built-in assert module
 * Run with: npx tsx src/utils/task-helper.test.ts
 */
import assert from 'assert';
import { formatTaskId, calculateTaskDuration, getTaskStatusEmoji } from './task-helper.js';

// Test counter
let passed = 0;
let failed = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error: any) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

// Tests for formatTaskId
console.log('\n--- formatTaskId tests ---');

runTest('should format a standard task ID', () => {
  assert.strictEqual(formatTaskId('task-1772524559309'), 'Task #1772524559309');
});

runTest('should handle task ID without prefix', () => {
  assert.strictEqual(formatTaskId('abc-123'), 'Task #abc-123');
});

runTest('should handle uppercase prefix', () => {
  assert.strictEqual(formatTaskId('TASK-123456'), 'Task #123456');
});

runTest('should handle empty string', () => {
  assert.strictEqual(formatTaskId(''), 'Task #unknown');
});

runTest('should handle non-string input', () => {
  assert.strictEqual(formatTaskId(undefined as any), 'Task #unknown');
  assert.strictEqual(formatTaskId(null as any), 'Task #unknown');
});

// Tests for calculateTaskDuration
console.log('\n--- calculateTaskDuration tests ---');

runTest('should calculate duration in seconds', () => {
  const start = '2024-01-01T10:00:00Z';
  const end = '2024-01-01T10:05:30Z';
  assert.strictEqual(calculateTaskDuration(start, end), 330); // 5 * 60 + 30 = 330
});

runTest('should handle exact minute differences', () => {
  const start = '2024-01-01T10:00:00Z';
  const end = '2024-01-01T10:10:00Z';
  assert.strictEqual(calculateTaskDuration(start, end), 600); // 10 minutes = 600 seconds
});

runTest('should return 0 for invalid dates', () => {
  assert.strictEqual(calculateTaskDuration('invalid', '2024-01-01T10:00:00Z'), 0);
  assert.strictEqual(calculateTaskDuration('2024-01-01T10:00:00Z', 'invalid'), 0);
});

runTest('should return 0 for empty strings', () => {
  assert.strictEqual(calculateTaskDuration('', ''), 0);
  assert.strictEqual(calculateTaskDuration('2024-01-01T10:00:00Z', ''), 0);
});

runTest('should return 0 for negative duration', () => {
  const start = '2024-01-01T10:05:00Z';
  const end = '2024-01-01T10:00:00Z';
  assert.strictEqual(calculateTaskDuration(start, end), 0);
});

// Tests for getTaskStatusEmoji
console.log('\n--- getTaskStatusEmoji tests ---');

runTest('should return correct emoji for pending', () => {
  assert.strictEqual(getTaskStatusEmoji('pending'), '⏳');
});

runTest('should return correct emoji for processing', () => {
  assert.strictEqual(getTaskStatusEmoji('processing'), '🔄');
});

runTest('should return correct emoji for completed', () => {
  assert.strictEqual(getTaskStatusEmoji('completed'), '✅');
});

runTest('should return correct emoji for failed', () => {
  assert.strictEqual(getTaskStatusEmoji('failed'), '❌');
});

runTest('should handle uppercase status', () => {
  assert.strictEqual(getTaskStatusEmoji('PENDING'), '⏳');
  assert.strictEqual(getTaskStatusEmoji('Completed'), '✅');
});

runTest('should return question mark for unknown status', () => {
  assert.strictEqual(getTaskStatusEmoji('unknown'), '❓');
  assert.strictEqual(getTaskStatusEmoji(''), '❓');
});

// Summary
console.log('\n--- Test Summary ---');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
