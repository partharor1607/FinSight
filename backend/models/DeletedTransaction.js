import mongoose from 'mongoose';

const deletedTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalTransactionId: {
    type: String,
    required: false // For reference if needed
  },
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['expense', 'income'],
    required: true
  },
  deletedAt: {
    type: Date,
    default: Date.now
  }
});

deletedTransactionSchema.index({ userId: 1, deletedAt: -1 });
deletedTransactionSchema.index({ userId: 1, deletedAt: 1 });

export default mongoose.model('DeletedTransaction', deletedTransactionSchema);

