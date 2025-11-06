import dotenv from 'dotenv';
import { createApp } from './app.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const app = createApp();
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  POST http://localhost:${PORT}/api/ai/chat`);
  console.log(`  GET  http://localhost:${PORT}/api/ai/history`);
  console.log(`  DELETE http://localhost:${PORT}/api/ai/history`);
});
