import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

/**
 * Initialize Google Drive API with service account or OAuth credentials
 */
const initializeDrive = () => {
  try {
    // Check if SERVICE_ACCOUNT_KEY is provided (preferred method)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      const serviceAccountKey = JSON.parse(
        Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString()
      );

      const auth = new google.auth.GoogleAuth({
        credentials: serviceAccountKey,
        scopes: ['https://www.googleapis.com/auth/drive.file']
      });

      return google.drive({ version: 'v3', auth });
    }

    // Fallback to service account file path
    if (process.env.GOOGLE_SERVICE_ACCOUNT_PATH) {
      const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
        scopes: ['https://www.googleapis.com/auth/drive.file']
      });

      return google.drive({ version: 'v3', auth });
    }

    throw new Error('Google Drive credentials not configured');
  } catch (error) {
    console.error('Error initializing Google Drive:', error);
    throw error;
  }
};

/**
 * Upload file to Google Drive
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File MIME type
 * @returns {Promise<{fileId: string, webViewLink: string, webContentLink: string}>}
 */
export const uploadToGoogleDrive = async (fileBuffer, fileName, mimeType) => {
  try {
    const drive = initializeDrive();

    // Get or create ads folder
    const folderId = await getOrCreateAdsFolder(drive);

    // Create a readable stream from buffer
    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);

    // Upload file metadata
    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };

    const media = {
      mimeType: mimeType,
      body: bufferStream
    };

    // Upload file
    const response = await drive.files.create({
  requestBody: fileMetadata,
  media: media,
  fields: 'id, name, mimeType, webViewLink, webContentLink',
  supportsAllDrives: true 
});

    // Make file publicly accessible
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    // Get the direct download link
    const file = await drive.files.get({
      fileId: response.data.id,
      fields: 'id, webViewLink, webContentLink'
    });

    // Construct direct link for public access
    const directLink = `https://drive.google.com/uc?export=view&id=${response.data.id}`;

    return {
      fileId: response.data.id,
      fileName: fileName,
      webViewLink: file.data.webViewLink,
      webContentLink: file.data.webContentLink,
      directLink: directLink,
      url: directLink // Primary URL for display
    };

  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw new Error(`Failed to upload to Google Drive: ${error.message}`);
  }
};

/**
 * Delete file from Google Drive
 * @param {string} fileId - Google Drive file ID
 * @returns {Promise<boolean>}
 */
export const deleteFromGoogleDrive = async (fileId) => {
  try {
    const drive = initializeDrive();

    await drive.files.delete({
      fileId: fileId
    });

    return true;

  } catch (error) {
    console.error('Error deleting from Google Drive:', error);
    // Don't throw error, just log it (file might already be deleted)
    return false;
  }
};

/**
 * Get or create the "MedicalAds" folder in Google Drive
 * @param {object} drive - Google Drive API instance
 * @returns {Promise<string>} Folder ID
 */
const getOrCreateAdsFolder = async (drive) => {
  const folderName = 'MedicalAds';

  try {
    // Check if folder exists
    const response = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    // Create folder if it doesn't exist
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id'
    });

    return folder.data.id;

  } catch (error) {
    console.error('Error creating/getting ads folder:', error);
    throw error;
  }
};

/**
 * Extract Google Drive file ID from URL
 * @param {string} url - Google Drive URL
 * @returns {string|null} File ID or null
 */
export const extractFileIdFromUrl = (url) => {
  if (!url) return null;

  // Pattern 1: https://drive.google.com/uc?export=view&id=FILE_ID
  const pattern1 = /[?&]id=([^&]+)/;
  const match1 = url.match(pattern1);
  if (match1) return match1[1];

  // Pattern 2: https://drive.google.com/file/d/FILE_ID/view
  const pattern2 = /\/file\/d\/([^/]+)/;
  const match2 = url.match(pattern2);
  if (match2) return match2[1];

  // Pattern 3: Direct file ID
  if (url.length > 20 && url.length < 50 && !url.includes('/')) {
    return url;
  }

  return null;
};

/**
 * Get file info from Google Drive
 * @param {string} fileId - Google Drive file ID
 * @returns {Promise<object>} File metadata
 */
export const getFileInfo = async (fileId) => {
  try {
    const drive = initializeDrive();

    const response = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size, webViewLink, webContentLink'
    });

    return response.data;

  } catch (error) {
    console.error('Error getting file info:', error);
    throw new Error(`Failed to get file info: ${error.message}`);
  }
};
