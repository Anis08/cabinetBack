import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/ads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ad-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images and videos
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/ogg'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

/**
 * Get all advertisements for the authenticated medecin
 */
export const getAds = async (req, res) => {
  const medecinId = req.medecinId;

  try {
    const ads = await prisma.advertisement.findMany({
      where: {
        medecinId: medecinId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      ads: ads,
      total: ads.length
    });

  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({
      message: 'Failed to fetch advertisements',
      error: error.message
    });
  }
};

/**
 * Get a single advertisement by ID
 */
export const getAdById = async (req, res) => {
  const medecinId = req.medecinId;
  const adId = parseInt(req.params.id);

  try {
    const ad = await prisma.advertisement.findFirst({
      where: {
        id: adId,
        medecinId: medecinId
      }
    });

    if (!ad) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }

    res.status(200).json(ad);

  } catch (error) {
    console.error('Error fetching ad:', error);
    res.status(500).json({
      message: 'Failed to fetch advertisement',
      error: error.message
    });
  }
};

/**
 * Create a new advertisement
 */
export const createAd = async (req, res) => {
  const medecinId = req.medecinId;
  const { title, type, fileUrl, dateFrom, dateTo, duration, position, active } = req.body;

  try {
    // Validate required fields
    if (!title || !type || !fileUrl || !dateFrom || !dateTo) {
      return res.status(400).json({
        message: 'Missing required fields: title, type, fileUrl, dateFrom, dateTo'
      });
    }

    // Validate type
    if (!['image', 'video'].includes(type)) {
      return res.status(400).json({
        message: 'Invalid type. Must be "image" or "video"'
      });
    }

    // Validate position
    if (position && !['top', 'bottom'].includes(position)) {
      return res.status(400).json({
        message: 'Invalid position. Must be "top" or "bottom"'
      });
    }

    // Create advertisement
    const ad = await prisma.advertisement.create({
      data: {
        medecinId: medecinId,
        title: title,
        type: type,
        fileUrl: fileUrl,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        duration: duration ? parseInt(duration) : 5,
        position: position || 'top',
        active: active !== undefined ? active : true
      }
    });

    res.status(201).json({
      message: 'Advertisement created successfully',
      ad: ad
    });

  } catch (error) {
    console.error('Error creating ad:', error);
    res.status(500).json({
      message: 'Failed to create advertisement',
      error: error.message
    });
  }
};

/**
 * Update an advertisement
 */
export const updateAd = async (req, res) => {
  const medecinId = req.medecinId;
  const adId = parseInt(req.params.id);
  const { title, type, fileUrl, dateFrom, dateTo, duration, position, active } = req.body;

  try {
    // Check if ad exists and belongs to medecin
    const existingAd = await prisma.advertisement.findFirst({
      where: {
        id: adId,
        medecinId: medecinId
      }
    });

    if (!existingAd) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }

    // Validate type if provided
    if (type && !['image', 'video'].includes(type)) {
      return res.status(400).json({
        message: 'Invalid type. Must be "image" or "video"'
      });
    }

    // Validate position if provided
    if (position && !['top', 'bottom'].includes(position)) {
      return res.status(400).json({
        message: 'Invalid position. Must be "top" or "bottom"'
      });
    }

    // Build update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
    if (dateFrom !== undefined) updateData.dateFrom = new Date(dateFrom);
    if (dateTo !== undefined) updateData.dateTo = new Date(dateTo);
    if (duration !== undefined) updateData.duration = parseInt(duration);
    if (position !== undefined) updateData.position = position;
    if (active !== undefined) updateData.active = active;

    // Update advertisement
    const ad = await prisma.advertisement.update({
      where: {
        id: adId
      },
      data: updateData
    });

    res.status(200).json({
      message: 'Advertisement updated successfully',
      ad: ad
    });

  } catch (error) {
    console.error('Error updating ad:', error);
    res.status(500).json({
      message: 'Failed to update advertisement',
      error: error.message
    });
  }
};

/**
 * Delete an advertisement
 */
export const deleteAd = async (req, res) => {
  const medecinId = req.medecinId;
  const adId = parseInt(req.params.id);

  try {
    // Check if ad exists and belongs to medecin
    const existingAd = await prisma.advertisement.findFirst({
      where: {
        id: adId,
        medecinId: medecinId
      }
    });

    if (!existingAd) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }

    // Delete file from filesystem if exists
    if (existingAd.fileUrl) {
      const fileName = path.basename(existingAd.fileUrl);
      const filePath = path.join(__dirname, '../../uploads/ads', fileName);
      
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      }
    }

    // Delete advertisement from database
    await prisma.advertisement.delete({
      where: {
        id: adId
      }
    });

    res.status(200).json({
      message: 'Advertisement deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting ad:', error);
    res.status(500).json({
      message: 'Failed to delete advertisement',
      error: error.message
    });
  }
};

/**
 * Handle file upload
 */
export const uploadAdFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Construct the file URL
    const fileUrl = `/uploads/ads/${req.file.filename}`;

    res.status(200).json({
      message: 'File uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      message: 'Failed to upload file',
      error: error.message
    });
  }
};

/**
 * Get active advertisements for public display (no authentication required)
 */
export const getActiveAds = async (req, res) => {
  try {
    const now = new Date();

    const ads = await prisma.advertisement.findMany({
      where: {
        active: true,
        dateFrom: {
          lte: now
        },
        dateTo: {
          gte: now
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        type: true,
        fileUrl: true,
        duration: true,
        position: true,
        dateFrom: true,
        dateTo: true,
        active: true
      }
    });

    res.status(200).json({
      ads: ads,
      total: ads.length
    });

  } catch (error) {
    console.error('Error fetching active ads:', error);
    res.status(500).json({
      message: 'Failed to fetch active advertisements',
      error: error.message
    });
  }
};
