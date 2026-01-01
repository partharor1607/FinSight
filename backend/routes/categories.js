import express from 'express';
import auth from '../middleware/auth.js';
import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// Get all categories
router.get('/', auth, async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user._id });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// Get category statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { userId: req.user._id, type: 'expense' };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const transactions = await Transaction.find(query);
    
    const categoryStats = {};
    transactions.forEach(t => {
      if (!categoryStats[t.category]) {
        categoryStats[t.category] = {
          total: 0,
          count: 0,
          average: 0
        };
      }
      categoryStats[t.category].total += t.amount;
      categoryStats[t.category].count += 1;
    });
    
    Object.keys(categoryStats).forEach(cat => {
      categoryStats[cat].average = categoryStats[cat].total / categoryStats[cat].count;
    });
    
    res.json(categoryStats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching category stats', error: error.message });
  }
});

// Create category
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, color, icon, budget } = req.body;
    
    const category = new Category({
      userId: req.user._id,
      name,
      type: type || 'expense',
      color: color || '#6366f1',
      icon: icon || '💰',
      budget: budget || 0
    });
    
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
});

// Update category
router.put('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
});

// Delete category
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Update transactions with this category to "Uncategorized"
    await Transaction.updateMany(
      { userId: req.user._id, category: category.name },
      { $set: { category: 'Uncategorized' } }
    );
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
});

export default router;

