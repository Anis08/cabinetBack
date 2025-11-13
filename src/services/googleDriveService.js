import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { Readable } from 'stream';

/**
 * Initialize Google Drive API with Service Account credentials
 */
const initializeDrive = () => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
  return google.drive({ version: 'v3', auth: oAuth2Client });
};

/**
 * Upload file to Google Drive
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
      fields: 'id, name, mimeType, webViewLink, webContentLink'
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
      url: directLink, // Store only the direct link
      // Optionally, you can still return webViewLink/webContentLink if needed
    };

  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw new Error(`Failed to upload to Google Drive: ${error.message}`);
  }
};


export const uploadExamsToGoogleDrive = async (fileBuffer, fileName, mimeType) => {
  try {
    const drive = initializeDrive();

    // Get or create ads folder
    const folderId = await getOrCreateExamsFolder(drive);

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
      fields: 'id, name, mimeType, webViewLink, webContentLink'
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
      url: directLink, // Store only the direct link
      // Optionally, you can still return webViewLink/webContentLink if needed
    };

  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw new Error(`Failed to upload to Google Drive: ${error.message}`);
  }
};

/**
 * Delete file from Google Drive
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
    return false;
  }
};

/**
 * Get or create the "MedicalAds" folder in Google Drive
 */
const getOrCreateAdsFolder = async (drive) => {
  const folderName = 'MedicalAds';

  // Search for the folder in My Drive
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
};


const getOrCreateExamsFolder = async (drive) => {
  const folderName = 'ExamensComplemantaires';

  // Search for the folder in My Drive
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
};

/**
 * Extract Google Drive file ID from URL
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
