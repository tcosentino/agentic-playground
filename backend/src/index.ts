import dotenv from 'dotenv';
import { createApp } from './app.js';

dotenv.config();

const app = createApp();
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  POST http://localhost:${PORT}/api/ai/chat`);
  console.log(`  GET  http://localhost:${PORT}/api/ai/history`);
  console.log(`  DELETE http://localhost:${PORT}/api/ai/history`);
});
