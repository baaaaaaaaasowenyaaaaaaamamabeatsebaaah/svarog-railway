// cron.js
import { scheduleWeeklyCrawl } from './src/services/weekly-crawler.js';

console.log('Starting weekly crawler scheduler...');
scheduleWeeklyCrawl();
console.log(
  'Scheduler running. Keep this process alive to maintain the schedule.'
);

// Keep process running
process.stdin.resume();
