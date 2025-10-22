import express from 'express';
import { setupRoutes } from './routes';
import { config } from './config';

const app = express();
const PORT = config.port || 3000;

// Middleware setup can go here

setupRoutes(app);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});