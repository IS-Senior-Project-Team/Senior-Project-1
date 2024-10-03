import express, { Request, Response } from 'express';
import { postUpload } from './controllers/upload';
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
    res.send('Hello, TypeScript Express!');
});

app.get('/upload', (req: Request, res: Response) => {
    postUpload(req, res);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});