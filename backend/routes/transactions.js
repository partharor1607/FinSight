import express from 'express';
import auth from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';
import DeletedTransaction from '../models/DeletedTransaction.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Get all transactions for user
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, category, type, limit = 100, page = 1 } = req.query;
    
    const query = { userId: req.user._id };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        console.log('📅 Filter startDate:', startDate, '-> Parsed:', start);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        console.log('📅 Filter endDate:', endDate, '-> Parsed:', end);
        query.date.$lte = end;
      }
      console.log('📅 Date query:', JSON.stringify(query.date));
    }
    
    if (category) query.category = category;
    if (type) query.type = type;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
});

// Get transaction by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transaction', error: error.message });
  }
});

// Create transaction
router.post('/', auth, [
  body('date').isISO8601(),
  body('description').trim().notEmpty(),
  body('amount').isFloat({ min: 0 }),
  body('type').isIn(['expense', 'income'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, description, amount, type, category, subcategory } = req.body;
    
    const transaction = new Transaction({
      userId: req.user._id,
      date,
      description,
      amount,
      type,
      category: category || 'Uncategorized',
      subcategory: subcategory || '',
      source: 'manual'
    });
    
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error creating transaction', error: error.message });
  }
});

// Update transaction
router.put('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error updating transaction', error: error.message });
  }
});

// Delete transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Save to deletion history before deleting
    try {
      await DeletedTransaction.create({
        userId: req.user._id,
        originalTransactionId: transaction._id.toString(),
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        category: transaction.category,
        type: transaction.type,
        deletedAt: new Date()
      });
    } catch (historyError) {
      console.error('Error saving deletion history:', historyError);
      // Continue with deletion even if history save fails
    }
    
    // Delete the transaction
    await Transaction.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting transaction', error: error.message });
  }
});

// Get deletion statistics
router.get('/deletions/stats', auth, async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const deletionsLastWeek = await DeletedTransaction.countDocuments({
      userId: req.user._id,
      deletedAt: { $gte: oneWeekAgo }
    });
    
    const totalDeletions = await DeletedTransaction.countDocuments({
      userId: req.user._id
    });
    
    res.json({
      deletionsLastWeek,
      totalDeletions
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching deletion stats', error: error.message });
  }
});

export default router;

