import 'dotenv/config';
import { tenderQueue } from './src/workers/queue.js'; // Imports the properly configured queue

async function triggerSync() {
  console.log('Adding sync job to queue...');
  
  // Use the existing queue which already has the correct Redis URL & TLS settings from your .env
  await tenderQueue.add('sync-dummy-tenders', {});
  
  console.log('Job added! Check your worker terminal.');
  process.exit(0);
}

triggerSync();