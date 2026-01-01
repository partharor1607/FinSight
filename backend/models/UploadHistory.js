import mongoose from 'mongoose';

const uploadHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  transactionsCount: {
    type: Number,
    required: true,
    default: 0
  },
  fileContent: {
    type: String, // Store file content for preview
    required: false
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'processing'],
    default: 'success'
  },
  errorMessage: {
    type: String,
    default: null
  }
});

uploadHistorySchema.index({ userId: 1, uploadDate: -1 });
uploadHistorySchema.index({ userId: 1 });
uploadHistorySchema.index({ userId: 1, originalFileName: 1, fileSize: 1 }); // For duplicate detection

export default mongoose.model('UploadHistory', uploadHistorySchema);

