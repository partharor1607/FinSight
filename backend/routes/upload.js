import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import auth from '../middleware/auth.js';
import fileParser from '../services/fileParser.js';
import aiCategorizer from '../services/aiCategorizer.js';
import Transaction from '../models/Transaction.js';
import UploadHistory from '../models/UploadHistory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Version check - this ensures we're running the latest code
const UPLOAD_ROUTE_VERSION = 'ES-MODULES-TXT-ONLY-v3.0-' + Date.now();
console.log('═══════════════════════════════════════════════════════');
console.log('📋 UPLOAD ROUTE LOADED - ES MODULES VERSION');
console.log('📋 Version:', UPLOAD_ROUTE_VERSION);
console.log('✅ Only TXT files are accepted');
console.log('❌ CSV and PDF are NOT accepted');
console.log('❌ OLD ERROR MESSAGE SHOULD NOT APPEAR');
console.log('═══════════════════════════════════════════════════════');

// Health check endpoint to verify version
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    version: UPLOAD_ROUTE_VERSION,
    allowedTypes: ['.txt'],
    message: 'Only TXT files are accepted'
  });
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    console.log('═══════════════════════════════════════════════════════');
    console.log('=== FILE UPLOAD FILTER (ES MODULES) ===');
    console.log('Route Version:', UPLOAD_ROUTE_VERSION);
    console.log('Filename:', file.originalname);
    console.log('Extension:', ext);
    console.log('Allowed types:', allowedTypes);
    console.log('Is allowed?', allowedTypes.includes(ext));
    console.log('═══════════════════════════════════════════════════════');
    if (allowedTypes.includes(ext)) {
      console.log('✅ File ACCEPTED:', file.originalname);
      cb(null, true);
    } else {
      console.log('❌ File REJECTED - extension not allowed:', ext);
      const errorMsg = 'Invalid file type. Only TXT files are allowed.';
      console.log('❌ Sending error:', errorMsg);
      console.log('❌ THIS IS THE NEW ERROR MESSAGE - NOT CSV/PDF');
      cb(new Error(errorMsg));
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Upload and process file
router.post('/', auth, upload.single('file'), handleMulterError, async (req, res) => {
  let filePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check for duplicate file upload
    const existingUpload = await UploadHistory.findOne({
      userId: req.user._id,
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
      status: 'success' // Only check successful uploads
    });

    if (existingUpload) {
      // Clean up the uploaded file since we're rejecting it
      filePath = req.file.path;
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      return res.status(409).json({ 
        message: 'This file has already been uploaded',
        error: `File "${req.file.originalname}" was already uploaded on ${new Date(existingUpload.uploadDate).toLocaleDateString()}. Please upload a different file.`,
        existingUpload: {
          uploadDate: existingUpload.uploadDate,
          transactionsCount: existingUpload.transactionsCount
        }
      });
    }

    filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let rawTransactions = [];

    // Parse TXT file
    try {
      if (fileExtension === '.txt') {
        console.log('Parsing TXT file:', filePath);
        rawTransactions = await fileParser.parseTXT(filePath);
        console.log(`TXT parsed, found ${rawTransactions.length} transactions`);
        
        if (!rawTransactions || rawTransactions.length === 0) {
          throw new Error(
            'No transactions found in TXT file.\n\n' +
            'Please ensure your TXT file has:\n' +
            '- Date column\n' +
            '- Description/Narration column\n' +
            '- Debit Amount and/or Credit Amount columns\n\n' +
            'The file should be space-delimited (2+ spaces between columns) or fixed-width format.'
          );
        }
        
        console.log(`✅ Successfully parsed ${rawTransactions.length} transactions from TXT`);
      } else {
        throw new Error('Unsupported file type. Please upload a TXT file.');
      }
    } catch (parseError) {
      console.error('File parsing error:', parseError);
      console.error('Error stack:', parseError.stack);
      
      // Save failed upload history
      const errorMessage = parseError.message || 'Unknown parsing error';
      try {
        let fileContent = null;
        if (filePath && fs.existsSync(filePath)) {
          try {
            fileContent = fs.readFileSync(filePath, 'utf-8');
            if (fileContent.length > 100000) {
              fileContent = fileContent.substring(0, 100000) + '\n... (truncated)';
            }
          } catch (readErr) {
            console.error('Error reading file for history:', readErr);
          }
        }
        
        await UploadHistory.create({
          userId: req.user._id,
          originalFileName: req.file.originalname,
          fileSize: req.file.size,
          fileType: fileExtension,
          transactionsCount: 0,
          fileContent: fileContent,
          uploadDate: new Date(),
          status: 'failed',
          errorMessage: errorMessage
        });
      } catch (historyError) {
        console.error('Error saving failed upload history:', historyError);
      }
      
      // Clean up file on parse error
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkErr) {
          console.error('Error deleting file:', unlinkErr);
        }
      }
      
      // Return more detailed error information
      return res.status(400).json({ 
        message: 'Error parsing file', 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? parseError.stack : undefined
      });
    }

    // Validate transactions before processing
    const validTransactions = rawTransactions.filter(t => {
      return t && 
             t.date && 
             t.description && 
             typeof t.amount === 'number' && 
             !isNaN(t.amount) && 
             t.amount > 0 &&
             t.type;
    });

    if (validTransactions.length === 0) {
      // Save failed upload history
      try {
        let fileContent = null;
        if (filePath && fs.existsSync(filePath)) {
          try {
            fileContent = fs.readFileSync(filePath, 'utf-8');
            if (fileContent.length > 100000) {
              fileContent = fileContent.substring(0, 100000) + '\n... (truncated)';
            }
          } catch (readErr) {
            console.error('Error reading file for history:', readErr);
          }
        }
        
        await UploadHistory.create({
          userId: req.user._id,
          originalFileName: req.file.originalname,
          fileSize: req.file.size,
          fileType: fileExtension,
          transactionsCount: 0,
          fileContent: fileContent,
          uploadDate: new Date(),
          status: 'failed',
          errorMessage: 'No valid transactions found in file'
        });
      } catch (historyError) {
        console.error('Error saving failed upload history:', historyError);
      }
      
      // Clean up file
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(400).json({ 
        message: 'No valid transactions found in file. Please check the file format.' 
      });
    }

    // Categorize transactions using AI (with error handling)
    const processedTransactions = [];
    for (const transaction of validTransactions) {
      try {
        const category = await aiCategorizer.categorizeTransaction(
          transaction.description || 'Unknown',
          transaction.amount,
          transaction.type || 'expense'
        );

        processedTransactions.push({
          userId: req.user._id,
          date: transaction.date instanceof Date ? transaction.date : new Date(transaction.date),
          description: String(transaction.description || 'Unknown').trim(),
          amount: parseFloat(transaction.amount),
          category: category || 'Uncategorized',
          type: transaction.type || 'expense',
          source: 'txt',
          metadata: {
            originalFile: req.file.originalname
          }
        });
      } catch (catError) {
        console.error('Error categorizing transaction:', catError);
        // Still add transaction with default category
        processedTransactions.push({
          userId: req.user._id,
          date: transaction.date instanceof Date ? transaction.date : new Date(transaction.date),
          description: String(transaction.description || 'Unknown').trim(),
          amount: parseFloat(transaction.amount),
          category: 'Uncategorized',
          type: transaction.type || 'expense',
          source: 'txt',
          metadata: {
            originalFile: req.file.originalname
          }
        });
      }
    }

    // Save transactions to database
    if (processedTransactions.length > 0) {
      // Read file content for preview before deleting
      let fileContent = null;
      try {
        if (filePath && fs.existsSync(filePath)) {
          fileContent = fs.readFileSync(filePath, 'utf-8');
          // Limit content size to 100KB for storage
          if (fileContent.length > 100000) {
            fileContent = fileContent.substring(0, 100000) + '\n... (truncated)';
          }
        }
      } catch (readError) {
        console.error('Error reading file content for history:', readError);
      }

      const savedTransactions = await Transaction.insertMany(processedTransactions);

      // Save upload history
      try {
        const uploadHistoryRecord = await UploadHistory.create({
          userId: req.user._id,
          originalFileName: req.file.originalname,
          fileSize: req.file.size,
          fileType: fileExtension,
          transactionsCount: savedTransactions.length,
          fileContent: fileContent,
          uploadDate: new Date(),
          status: 'success'
        });
        console.log('✅ Upload history saved successfully:', uploadHistoryRecord._id);
      } catch (historyError) {
        console.error('❌ Error saving upload history:', historyError);
        console.error('Error details:', historyError.message);
        console.error('Error stack:', historyError.stack);
        // Don't fail the request if history save fails
      }

      // Clean up uploaded file
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({
        message: 'File processed successfully',
        transactionsCount: savedTransactions.length,
        transactions: savedTransactions
      });
    } else {
      // Clean up file
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      res.status(400).json({ 
        message: 'No transactions could be processed from the file.' 
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    
    // Save failed upload history if we have file info
    if (req.file) {
      try {
        let fileContent = null;
        if (filePath && fs.existsSync(filePath)) {
          try {
            fileContent = fs.readFileSync(filePath, 'utf-8');
            if (fileContent.length > 100000) {
              fileContent = fileContent.substring(0, 100000) + '\n... (truncated)';
            }
          } catch (readErr) {
            console.error('Error reading file for history:', readErr);
          }
        }
        
        await UploadHistory.create({
          userId: req.user._id,
          originalFileName: req.file.originalname,
          fileSize: req.file.size,
          fileType: path.extname(req.file.originalname).toLowerCase(),
          transactionsCount: 0,
          fileContent: fileContent,
          uploadDate: new Date(),
          status: 'failed',
          errorMessage: error.message || 'An unexpected error occurred'
        });
      } catch (historyError) {
        console.error('Error saving failed upload history:', historyError);
      }
    }
    
    // Clean up file on error
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    res.status(500).json({ 
      message: 'Error processing file', 
      error: error.message || 'An unexpected error occurred while processing the file'
    });
  }
});

// Get upload history
router.get('/history', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    console.log('📋 Fetching upload history for user:', req.user._id);
    
    const uploads = await UploadHistory.find({ userId: req.user._id })
      .sort({ uploadDate: -1 })
      .limit(parseInt(limit))
      .select('-fileContent'); // Don't send full content in list, only on preview
    
    const totalUploads = await UploadHistory.countDocuments({ userId: req.user._id });
    
    console.log(`✅ Found ${uploads.length} uploads, total: ${totalUploads}`);
    
    res.json({
      uploads,
      totalUploads
    });
  } catch (error) {
    console.error('❌ Error fetching upload history:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error fetching upload history', 
      error: error.message 
    });
  }
});

// Get upload preview (file content)
router.get('/history/:id/preview', auth, async (req, res) => {
  try {
    const upload = await UploadHistory.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!upload) {
      return res.status(404).json({ message: 'Upload not found' });
    }
    
    res.json({
      fileName: upload.originalFileName,
      fileContent: upload.fileContent || 'Content not available',
      uploadDate: upload.uploadDate,
      transactionsCount: upload.transactionsCount
    });
  } catch (error) {
    console.error('Error fetching upload preview:', error);
    res.status(500).json({ 
      message: 'Error fetching upload preview', 
      error: error.message 
    });
  }
});

export default router;

