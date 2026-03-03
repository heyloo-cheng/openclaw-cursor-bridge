/**
 * Task Helper Utilities
 * 
 * This module provides utility functions for task management in the OpenClaw-Cursor Bridge.
 */

/**
 * Task status types
 */
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Formats a task ID into a readable format.
 * 
 * @param id - The raw task ID string (e.g., "task-1772524559309")
 * @returns Formatted task ID (e.g., "Task #1772524559309")
 * 
 * @example
 * formatTaskId("task-1772524559309") // Returns "Task #1772524559309"
 * formatTaskId("abc-123") // Returns "Task #abc-123"
 */
export function formatTaskId(id: string): string {
  if (!id || typeof id !== 'string') {
    return 'Task #unknown';
  }
  
  // Extract the numeric or alphanumeric part after "task-" prefix
  const taskNumber = id.replace(/^task-/i, '');
  return `Task #${taskNumber}`;
}

/**
 * Calculates the duration between two ISO 8601 time strings.
 * 
 * @param startTime - Start time in ISO 8601 format
 * @param endTime - End time in ISO 8601 format
 * @returns Duration in seconds
 * 
 * @example
 * calculateTaskDuration("2024-01-01T10:00:00Z", "2024-01-01T10:05:30Z") // Returns 330
 */
export function calculateTaskDuration(startTime: string, endTime: string): number {
  if (!startTime || !endTime) {
    return 0;
  }
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0;
  }
  
  const durationMs = end.getTime() - start.getTime();
  
  // Return 0 for negative durations (end time before start time)
  if (durationMs < 0) {
    return 0;
  }
  
  return Math.floor(durationMs / 1000);
}

/**
 * Returns the corresponding emoji for a task status.
 * 
 * @param status - The task status string
 * @returns Emoji representation of the status
 * 
 * @example
 * getTaskStatusEmoji("pending")   // Returns "⏳"
 * getTaskStatusEmoji("processing") // Returns "🔄"
 * getTaskStatusEmoji("completed") // Returns "✅"
 * getTaskStatusEmoji("failed")     // Returns "❌"
 * getTaskStatusEmoji("unknown")   // Returns "❓"
 */
export function getTaskStatusEmoji(status: string): string {
  if (!status || typeof status !== 'string') {
    return '❓';
  }
  
  const statusMap: Record<TaskStatus, string> = {
    pending: '⏳',
    processing: '🔄',
    completed: '✅',
    failed: '❌'
  };
  
  const normalizedStatus = status.toLowerCase() as TaskStatus;
  return statusMap[normalizedStatus] || '❓';
}
