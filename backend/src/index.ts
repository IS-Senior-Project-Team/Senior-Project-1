import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { postUpload } from './controllers/upload';

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
// This is needed to work with the frontend
app.use(cors({
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Set up multer for file uploads with file type validation
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// File type filter to accept only CSV files
const csvFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (fileExtension === '.csv') {
        cb(null, true);
    } else {
        cb(new Error('Only CSV files are allowed!'));
    }
};

// Configure multer to use the storage and file filter
const upload = multer({ 
    storage: storage,
    fileFilter: csvFileFilter
});

app.post('/upload', upload.array('files', 5), (req: Request, res: Response) => {
    postUpload(req, res);
});

app.get('/', upload.array('files', 5), (req: Request, res: Response) => {
   res.send("Successful");
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});