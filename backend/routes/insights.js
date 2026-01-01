import express from 'express';
import auth from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';
import aiCategorizer from '../services/aiCategorizer.js';

const router = express.Router();

// Get financial insights
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { userId: req.user._id };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const transactions = await Transaction.find(query).sort({ date: 1 });
    
    // Calculate trends
    const trends = calculateTrends(transactions);
    
    // Generate AI advice
    const advice = await aiCategorizer.generateFinancialAdvice(transactions, trends);
    
    // Category breakdown
    const categoryBreakdown = getCategoryBreakdown(transactions);
    
    // Monthly spending
    const monthlySpending = getMonthlySpending(transactions);
    
    // Alerts
    const alerts = generateAlerts(transactions, trends);
    
    // Additional insights
    const additionalInsights = getAdditionalInsights(transactions);
    
    res.json({
      trends,
      advice,
      categoryBreakdown,
      monthlySpending,
      alerts,
      summary: {
        totalExpenses: trends.totalExpenses,
        totalIncome: trends.totalIncome,
        netAmount: trends.totalIncome - trends.totalExpenses,
        transactionCount: transactions.length
      },
      ...additionalInsights
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating insights', error: error.message });
  }
});

// Get monthly trends
router.get('/trends', auth, async (req, res) => {
  try {
    const { months = 6 } = req.query;
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    
    const transactions = await Transaction.find({
      userId: req.user._id,
      date: { $gte: startDate }
    }).sort({ date: 1 });
    
    const trends = calculateTrends(transactions);
    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trends', error: error.message });
  }
});

function calculateTrends(transactions) {
  const expenses = transactions.filter(t => t.type === 'expense');
  const income = transactions.filter(t => t.type === 'income');
  
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  
  // Monthly trend
  const monthlyData = {};
  transactions.forEach(t => {
    const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { expenses: 0, income: 0 };
    }
    if (t.type === 'expense') {
      monthlyData[monthKey].expenses += t.amount;
    } else {
      monthlyData[monthKey].income += t.amount;
    }
  });
  
  const monthlyTrend = Object.entries(monthlyData)
    .sort()
    .map(([month, data]) => ({
      month,
      expenses: data.expenses,
      income: data.income,
      net: data.income - data.expenses
    }));
  
  // Category spending
  const categorySpending = {};
  expenses.forEach(t => {
    categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
  });
  
  // Average daily spending
  const days = new Set(transactions.map(t => t.date.toDateString())).size;
  const avgDailySpending = days > 0 ? totalExpenses / days : 0;
  
  return {
    totalExpenses,
    totalIncome,
    monthlyTrend,
    categorySpending,
    avgDailySpending,
    expenseCount: expenses.length,
    incomeCount: income.length
  };
}

function getCategoryBreakdown(transactions) {
  const breakdown = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
    });
  return breakdown;
}

function getMonthlySpending(transactions) {
  const monthly = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      monthly[monthKey] = (monthly[monthKey] || 0) + t.amount;
    });
  return monthly;
}

function generateAlerts(transactions, trends) {
  const alerts = [];
  
  // High spending alert
  if (trends.monthlyTrend && trends.monthlyTrend.length >= 2) {
    const recent = trends.monthlyTrend.slice(-2);
    if (recent[1].expenses > recent[0].expenses * 1.2) {
      alerts.push({
        type: 'warning',
        message: `Your spending increased by ${((recent[1].expenses - recent[0].expenses) / recent[0].expenses * 100).toFixed(1)}% compared to last month`,
        severity: 'medium'
      });
    }
  }
  
  // Large transaction alert (₹500 threshold for Indian Rupees)
  const largeTransactions = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    const amount = parseFloat(t.amount) || 0;
    return amount > 500;
  });
  
  if (largeTransactions.length > 0) {
    alerts.push({
      type: 'info',
      message: `You have ${largeTransactions.length} large transaction(s) (>₹500) this period`,
      severity: 'low'
    });
  }
  
  // Negative balance alert
  if (trends.totalIncome - trends.totalExpenses < 0) {
    alerts.push({
      type: 'error',
      message: 'Your expenses exceed your income this period',
      severity: 'high'
    });
  }
  
  return alerts;
}

function getAdditionalInsights(transactions) {
  const expenses = transactions.filter(t => t.type === 'expense' && t.amount != null);
  const income = transactions.filter(t => t.type === 'income' && t.amount != null);
  
  // Max and Min transactions
  const maxExpense = expenses.length > 0 
    ? expenses.reduce((max, t) => t.amount > max.amount ? t : max, expenses[0])
    : null;
  const minExpense = expenses.length > 0
    ? expenses.reduce((min, t) => t.amount < min.amount ? t : min, expenses[0])
    : null;
  const maxIncome = income.length > 0
    ? income.reduce((max, t) => t.amount > max.amount ? t : max, income[0])
    : null;
  const minIncome = income.length > 0
    ? income.reduce((min, t) => t.amount < min.amount ? t : min, income[0])
    : null;
  
  // Top transactions (largest expenses)
  const topExpenses = [...expenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map(t => ({
      description: t.description,
      amount: t.amount,
      category: t.category,
      date: t.date,
      source: t.source
    }));
  
  // Top income transactions
  const topIncome = [...income]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map(t => ({
      description: t.description,
      amount: t.amount,
      category: t.category,
      date: t.date,
      source: t.source
    }));
  
  // Average transaction amounts
  const avgExpense = expenses.length > 0 
    ? expenses.reduce((sum, t) => {
        const amount = parseFloat(t.amount) || 0;
        return sum + amount;
      }, 0) / expenses.length 
    : 0;
  const avgIncome = income.length > 0
    ? income.reduce((sum, t) => {
        const amount = parseFloat(t.amount) || 0;
        return sum + amount;
      }, 0) / income.length
    : 0;
  
  // Most frequent category
  const categoryCounts = {};
  expenses.forEach(t => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });
  const mostFrequentCategory = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  
  // Average spending per category
  const categoryAverages = {};
  const categoryTransactionCounts = {};
  expenses.forEach(t => {
    if (!categoryAverages[t.category]) {
      categoryAverages[t.category] = 0;
      categoryTransactionCounts[t.category] = 0;
    }
    categoryAverages[t.category] += t.amount;
    categoryTransactionCounts[t.category] += 1;
  });
  Object.keys(categoryAverages).forEach(cat => {
    categoryAverages[cat] = categoryAverages[cat] / categoryTransactionCounts[cat];
  });
  
  return {
    maxExpense: maxExpense ? {
      description: maxExpense.description,
      amount: parseFloat(maxExpense.amount || 0),
      category: maxExpense.category,
      date: maxExpense.date,
      source: maxExpense.source
    } : null,
    minExpense: minExpense ? {
      description: minExpense.description,
      amount: parseFloat(minExpense.amount || 0),
      category: minExpense.category,
      date: minExpense.date,
      source: minExpense.source
    } : null,
    maxIncome: maxIncome ? {
      description: maxIncome.description,
      amount: parseFloat(maxIncome.amount || 0),
      category: maxIncome.category,
      date: maxIncome.date,
      source: maxIncome.source
    } : null,
    minIncome: minIncome ? {
      description: minIncome.description,
      amount: parseFloat(minIncome.amount || 0),
      category: minIncome.category,
      date: minIncome.date,
      source: minIncome.source
    } : null,
    topExpenses: topExpenses.map(t => ({
      ...t,
      amount: parseFloat(t.amount || 0)
    })),
    topIncome: topIncome.map(t => ({
      ...t,
      amount: parseFloat(t.amount || 0)
    })),
    avgExpense: parseFloat(avgExpense.toFixed(2)),
    avgIncome: parseFloat(avgIncome.toFixed(2)),
    mostFrequentCategory,
    categoryAverages: Object.fromEntries(
      Object.entries(categoryAverages).map(([cat, avg]) => [cat, parseFloat(avg.toFixed(2))])
    )
  };
}

export default router;

