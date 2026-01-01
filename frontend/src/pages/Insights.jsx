import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchInsights } from '../store/slices/insightSlice'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Lightbulb, TrendingUp, AlertTriangle, ArrowUp, ArrowDown, DollarSign, Target, Award } from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency, formatCurrencyTooltip } from '../utils/currency'

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export default function Insights() {
  const dispatch = useDispatch()
  const { insights, loading } = useSelector((state) => state.insights)

  useEffect(() => {
    dispatch(fetchInsights())
  }, [dispatch])

  if (loading || !insights) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading insights...</div>
      </div>
    )
  }

  const categoryData = Object.entries(insights.categoryBreakdown || {}).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2)),
  }))

  const monthlyData = (insights.monthlySpending || {})
  const chartData = Object.entries(monthlyData).map(([month, amount]) => ({
    month: month.split('-')[1] + '/' + month.split('-')[0].slice(2),
    amount: parseFloat(amount.toFixed(2)),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Financial Insights</h1>
        <p className="text-gray-600 mt-1">AI-powered analysis of your spending patterns</p>
      </div>

      {/* AI Advice */}
      {insights.advice && insights.advice.length > 0 && (
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl shadow-sm border border-primary-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Lightbulb className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">AI Financial Advice</h2>
          </div>
          <ul className="space-y-2">
            {Array.isArray(insights.advice) ? (
              insights.advice.map((tip, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-primary-600 mt-1">•</span>
                  <p className="text-gray-700">{tip}</p>
                </li>
              ))
            ) : (
              <li className="text-gray-700">{insights.advice}</li>
            )}
          </ul>
        </div>
      )}

      {/* Monthly Trends Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Monthly Spending Trend</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrencyTooltip(value)} />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#0ea5e9" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Breakdown */}
      {categoryData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Category Breakdown</h2>
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrencyTooltip(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full lg:w-auto">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Color Mapping</h3>
                <div className="space-y-2">
                  {categoryData.map((entry, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{entry.name}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(entry.value)} ({(entry.value / categoryData.reduce((sum, e) => sum + e.value, 0) * 100).toFixed(1)}%)</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Category Spending</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrencyTooltip(value)} />
                <Bar dataKey="value" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Alerts */}
      {insights.alerts && insights.alerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h2 className="text-xl font-semibold text-gray-900">Alerts & Notifications</h2>
          </div>
          <div className="space-y-3">
            {insights.alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  alert.severity === 'high'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : alert.severity === 'medium'
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(insights.summary?.totalExpenses || 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Total Income</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(insights.summary?.totalIncome || 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Net Amount</p>
          <p
            className={`text-2xl font-bold mt-2 ${
              (insights.summary?.totalIncome || 0) - (insights.summary?.totalExpenses || 0) >= 0
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          >
            {formatCurrency((insights.summary?.totalIncome || 0) - (insights.summary?.totalExpenses || 0))}
          </p>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Max & Min Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Target className="h-5 w-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Transaction Extremes</h2>
          </div>
          <div className="space-y-4">
            {insights.maxExpense && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-2 mb-2">
                  <ArrowDown className="h-4 w-4 text-red-600" />
                  <p className="text-sm font-semibold text-red-700">Largest Expense</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(insights.maxExpense.amount)}</p>
                <p className="text-sm text-gray-600 mt-1">{insights.maxExpense.description}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">{insights.maxExpense.category}</span>
                  <span className="text-xs text-gray-500">{format(new Date(insights.maxExpense.date), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            )}
            {insights.minExpense && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <ArrowDown className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-semibold text-blue-700">Smallest Expense</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(insights.minExpense.amount)}</p>
                <p className="text-sm text-gray-600 mt-1">{insights.minExpense.description}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">{insights.minExpense.category}</span>
                  <span className="text-xs text-gray-500">{format(new Date(insights.minExpense.date), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            )}
            {insights.maxIncome && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <ArrowUp className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-semibold text-green-700">Largest Income</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(insights.maxIncome.amount)}</p>
                <p className="text-sm text-gray-600 mt-1">{insights.maxIncome.description}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">{insights.maxIncome.category}</span>
                  <span className="text-xs text-gray-500">{format(new Date(insights.maxIncome.date), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Average Transaction Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <DollarSign className="h-5 w-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Average Statistics</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Average Expense</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(insights.avgExpense || 0)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Average Income</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(insights.avgIncome || 0)}
              </p>
            </div>
            {insights.mostFrequentCategory && (
              <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                <p className="text-sm text-gray-600">Most Frequent Category</p>
                <p className="text-xl font-bold text-primary-700 mt-1">
                  {insights.mostFrequentCategory}
                </p>
              </div>
            )}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {insights.summary?.transactionCount || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Expenses */}
        {insights.topExpenses && insights.topExpenses.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Award className="h-5 w-5 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-900">Top 5 Expenses</h2>
            </div>
            <div className="space-y-3">
              {insights.topExpenses.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                        {index + 1}
                      </span>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                    </div>
                    <div className="flex items-center space-x-2 mt-1 ml-8">
                      <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">{transaction.category}</span>
                      <span className="text-xs text-gray-500">{format(new Date(transaction.date), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(transaction.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Income */}
        {insights.topIncome && insights.topIncome.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Award className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Top 5 Income</h2>
            </div>
            <div className="space-y-3">
              {insights.topIncome.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold">
                        {index + 1}
                      </span>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                    </div>
                    <div className="flex items-center space-x-2 mt-1 ml-8">
                      <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">{transaction.category}</span>
                      <span className="text-xs text-gray-500">{format(new Date(transaction.date), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(transaction.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

