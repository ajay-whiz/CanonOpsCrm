import express from 'express';
import { json, urlencoded } from 'body-parser';
import routes from './routes';
import middleware from './middleware';

const app = express();

// Middleware
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(middleware);

// Routes
app.use('/api', routes);

export default app;