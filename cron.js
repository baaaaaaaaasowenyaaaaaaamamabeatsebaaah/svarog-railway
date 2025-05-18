// cron.js
import { runCrawler } from './src/services/weekly-crawler.js';

console.log('Starting crawler...');
runCrawler()
  .then(() => {
    console.log('Crawler run completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error running crawler:', error);
    process.exit(1);
  });
