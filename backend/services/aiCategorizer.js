import OpenAI from 'openai';

class AICategorizer {
  constructor() {
    this.openai = process.env.OPENAI_API_KEY 
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;
    
    // Default categories mapping
    this.categoryKeywords = {
      'Food & Dining': ['restaurant', 'cafe', 'food', 'dining', 'pizza', 'burger', 'starbucks', 'mcdonald', 'uber eats', 'doordash', 'grubhub'],
      'Shopping': ['amazon', 'target', 'walmart', 'store', 'shop', 'retail', 'purchase', 'buy'],
      'Transportation': ['uber', 'lyft', 'taxi', 'gas', 'fuel', 'parking', 'metro', 'subway', 'bus', 'train', 'airline'],
      'Bills & Utilities': ['electric', 'water', 'gas', 'internet', 'phone', 'cable', 'utility', 'bill'],
      'Entertainment': ['netflix', 'spotify', 'movie', 'cinema', 'theater', 'concert', 'game', 'entertainment'],
      'Healthcare': ['pharmacy', 'doctor', 'hospital', 'medical', 'health', 'dental', 'clinic'],
      'Education': ['school', 'tuition', 'course', 'education', 'university', 'college', 'bookstore'],
      'Travel': ['hotel', 'airbnb', 'flight', 'travel', 'vacation', 'trip'],
      'Groceries': ['grocery', 'supermarket', 'whole foods', 'kroger', 'safeway', 'aldi'],
      'Personal Care': ['salon', 'barber', 'spa', 'gym', 'fitness', 'beauty'],
      'Income': ['salary', 'payroll', 'deposit', 'income', 'payment received', 'refund']
    };
  }

  async categorizeTransaction(description, amount, type) {
    // If OpenAI is available, use it for better categorization
    if (this.openai && description) {
      try {
        return await this.categorizeWithAI(description, amount, type);
      } catch (error) {
        console.error('AI categorization failed, using keyword matching:', error.message);
      }
    }
    
    // Fallback to keyword-based categorization
    return this.categorizeWithKeywords(description, amount, type);
  }

  async categorizeWithAI(description, amount, type) {
    const prompt = `Categorize this financial transaction into one of these categories:
Food & Dining, Shopping, Transportation, Bills & Utilities, Entertainment, Healthcare, Education, Travel, Groceries, Personal Care, Income, Uncategorized

Transaction: "${description}"
Amount: ${amount}
Type: ${type}

Respond with only the category name, nothing else.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a financial transaction categorizer. Respond with only the category name.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 20,
        temperature: 0.3
      });

      const category = response.choices[0].message.content.trim();
      return this.validateCategory(category) ? category : 'Uncategorized';
    } catch (error) {
      throw error;
    }
  }

  categorizeWithKeywords(description, amount, type) {
    if (!description) return 'Uncategorized';
    
    const descLower = description.toLowerCase();
    
    // Check income first
    if (type === 'income') {
      return 'Income';
    }
    
    // Check against keyword mappings
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      if (keywords.some(keyword => descLower.includes(keyword))) {
        return category;
      }
    }
    
    return 'Uncategorized';
  }

  validateCategory(category) {
    const validCategories = [
      'Food & Dining', 'Shopping', 'Transportation', 'Bills & Utilities',
      'Entertainment', 'Healthcare', 'Education', 'Travel', 'Groceries',
      'Personal Care', 'Income', 'Uncategorized'
    ];
    return validCategories.includes(category);
  }

  async generateFinancialAdvice(transactions, trends) {
    if (!this.openai) {
      return this.generateBasicAdvice(transactions, trends);
    }

    try {
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const categoryBreakdown = this.getCategoryBreakdown(transactions);
      const monthlyTrend = trends.monthlyTrend || [];
      
      const prompt = `Based on the following financial data, provide 3-5 actionable financial advice tips in a concise format:

Total Monthly Expenses: $${totalExpenses.toFixed(2)}
Category Breakdown: ${JSON.stringify(categoryBreakdown)}
Monthly Trend: ${JSON.stringify(monthlyTrend.slice(-3))}

Provide practical, actionable advice. Format as a JSON array of advice strings.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a financial advisor. Provide practical, actionable advice based on spending patterns.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      const adviceText = response.choices[0].message.content.trim();
      // Try to parse as JSON, fallback to splitting by lines
      try {
        return JSON.parse(adviceText);
      } catch {
        return adviceText.split('\n').filter(line => line.trim().length > 0);
      }
    } catch (error) {
      console.error('AI advice generation failed:', error.message);
      return this.generateBasicAdvice(transactions, trends);
    }
  }

  generateBasicAdvice(transactions, trends) {
    const advice = [];
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const categoryBreakdown = this.getCategoryBreakdown(transactions);
    const topCategory = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (topCategory) {
      advice.push(`Your largest expense category is ${topCategory[0]} (${((topCategory[1] / totalExpenses) * 100).toFixed(1)}%). Consider reviewing this category for potential savings.`);
    }
    
    if (trends.monthlyTrend && trends.monthlyTrend.length >= 2) {
      const recent = trends.monthlyTrend.slice(-2);
      if (recent[1] > recent[0]) {
        advice.push(`Your spending increased by ${((recent[1] - recent[0]) / recent[0] * 100).toFixed(1)}% this month. Monitor your expenses closely.`);
      }
    }
    
    advice.push('Set up monthly budgets for each category to better track your spending.');
    advice.push('Review your transactions weekly to identify any unusual spending patterns.');
    
    return advice;
  }

  getCategoryBreakdown(transactions) {
    const breakdown = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
      });
    return breakdown;
  }
}

export default new AICategorizer();

