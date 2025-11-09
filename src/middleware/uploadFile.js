import multer from 'multer';

// Store file in memory (good for storing in DB as a Blob)
const storage = multer.memoryStorage();

const upload = multer({ storage });

export default upload;
