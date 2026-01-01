import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTransactions } from '../store/slices/transactionSlice'
import { fetchInsights } from '../store/slices/insightSlice'
import { format, subDays } from 'date-fns'
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Calendar } from 'lucide-react'
import { formatCurrency } from '../utils/currency'

export default function Dashboard() {
  const dispatch = useDispatch()
  const { transactions, pagination, loading } = useSelector((state) => state.transactions)
  const { insights } = useSelector((state) => state.insights)
  const [daysFilter, setDaysFilter] = useState(15)
  const [isFilterChanging, setIsFilterChanging] = useState(false)

  useEffect(() => {
    // Calculate start date based on days filter (start of day)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today
    
    const startDate = subDays(new Date(), daysFilter)
    startDate.setHours(0, 0, 0, 0) // Start of that day
    
    console.log(`📅 Filtering transactions: Last ${daysFilter} days`)
    console.log('Start date:', startDate.toISOString())
    console.log('End date:', today.toISOString())
    
    setIsFilterChanging(true)
    dispatch(fetchTransactions({ 
      limit: 1000, // Increased to show all transactions in the date range
      startDate: startDate.toISOString(),
      endDate: today.toISOString()
    }))
    dispatch(fetchInsights())
  }, [dispatch, daysFilter])

  // Reset filter changing state when loading completes
  useEffect(() => {
    if (!loading) {
      // Small delay to ensure smooth transition
      setTimeout(() => {
        setIsFilterChanging(false)
      }, 300)
    }
  }, [loading])

  if (!insights) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  const summary = insights.summary || {}
  // Transactions are already filtered by backend based on daysFilter
  // Display all transactions that match the filter
  const recentTransactions = transactions

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your financial activity</p>
      </div>

      {/* Summary Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 transition-opacity duration-300 ${
        (loading || isFilterChanging) ? 'opacity-60' : 'opacity-100'
      }`}>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 transition-all duration-300">
                {formatCurrency(summary.totalExpenses || 0)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 transition-all duration-300">
                {formatCurrency(summary.totalIncome || 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Amount</p>
              <p className={`text-2xl font-bold mt-1 transition-all duration-300 ${
                (summary.totalIncome - summary.totalExpenses) >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {formatCurrency((summary.totalIncome || 0) - (summary.totalExpenses || 0))}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 transition-all duration-300">
                {summary.transactionCount || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {insights.alerts && insights.alerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alerts</h2>
          <div className="space-y-2">
            {insights.alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  alert.severity === 'high'
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : alert.severity === 'medium'
                    ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                    : 'bg-blue-50 border border-blue-200 text-blue-700'
                }`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-300">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              <p className="text-xs text-gray-500 mt-1 transition-opacity duration-300">
                Showing transactions from {format(subDays(new Date(), daysFilter), 'MMM dd, yyyy')} to {format(new Date(), 'MMM dd, yyyy')}
                {pagination?.total !== undefined && (
                  <span className="ml-2 font-medium text-primary-600">({pagination.total} found)</span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Calendar className={`h-5 w-5 transition-colors duration-300 ${
                  isFilterChanging ? 'text-primary-500' : 'text-gray-500'
                }`} />
              </div>
              <div className="relative">
                <select
                  value={daysFilter}
                  onChange={(e) => {
                    setDaysFilter(Number(e.target.value))
                    setIsFilterChanging(true)
                  }}
                  disabled={loading}
                  className={`px-4 py-2.5 border-2 rounded-lg text-sm font-semibold bg-white cursor-pointer transition-all duration-300 ${
                    isFilterChanging || loading
                      ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md scale-105'
                      : 'border-gray-300 text-gray-700 hover:border-primary-400 hover:shadow-sm'
                  } focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none`}
                >
                  <option value={15}>Last 15 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={60}>Last 60 days</option>
                  <option value={90}>Last 90 days</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className={`divide-y divide-gray-200 transition-opacity duration-300 ${
          (loading || isFilterChanging) ? 'opacity-50' : 'opacity-100'
        }`}>
          {loading && isFilterChanging ? (
            <div className="p-6">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-5 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : recentTransactions.length > 0 ? (
            recentTransactions.map((transaction, index) => (
              <div
                key={transaction._id}
                className="p-6 hover:bg-gray-50 transition-all duration-200 animate-in"
                style={{
                  animationDelay: `${index * 0.03}s`,
                  animationFillMode: 'both'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')} • {transaction.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold transition-colors duration-200 ${
                        transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              No transactions found for the selected period.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

