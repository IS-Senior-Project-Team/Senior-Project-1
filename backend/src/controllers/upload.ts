import express, { Request, Response } from 'express';
import multer from 'multer';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
    // Destination folder
      cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
    // Unique filename
      cb(null, Date.now() + '-' + file.originalname); 
    }
  });
  
// Set up multer storage
const upload = multer({ storage: storage });
export const postUpload = (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
      }
    
      const uploadedFile = req.file;
      res.status(200).send(`File uploaded: ${uploadedFile.originalname}`);
  };
