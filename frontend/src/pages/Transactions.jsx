import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTransactions, deleteTransaction } from '../store/slices/transactionSlice'
import { format } from 'date-fns'
import { Trash2, Edit, Plus, AlertTriangle, X } from 'lucide-react'
import { formatCurrency } from '../utils/currency'
import api from '../utils/axiosConfig'
import { useToast } from '../contexts/ToastContext'

export default function Transactions() {
  const dispatch = useDispatch()
  const { showToast } = useToast()
  const { transactions, loading } = useSelector((state) => state.transactions)
  const [filter, setFilter] = useState({ type: '', category: '' })
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deletionsLastWeek, setDeletionsLastWeek] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    dispatch(fetchTransactions())
    fetchDeletionStats()
  }, [dispatch])

  const fetchDeletionStats = async () => {
    try {
      const response = await api.get('/transactions/deletions/stats')
      setDeletionsLastWeek(response.data.deletionsLastWeek || 0)
    } catch (error) {
      console.error('Error fetching deletion stats:', error)
    }
  }

  const handleDelete = async (transaction) => {
    setDeleteConfirm(transaction)
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    
    setDeleting(true)
    try {
      await dispatch(deleteTransaction(deleteConfirm._id))
      dispatch(fetchTransactions())
      fetchDeletionStats()
      showToast(`Transaction "${deleteConfirm.description}" deleted successfully`, 'success', 3000)
      setDeleteConfirm(null)
    } catch (error) {
      showToast('Failed to delete transaction', 'error', 3000)
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteConfirm(null)
  }

  const filteredTransactions = transactions.filter((t) => {
    if (filter.type && t.type !== filter.type) return false
    if (filter.category && t.category !== filter.category) return false
    return true
  })

  const categories = [...new Set(transactions.map((t) => t.category))]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-1">View and manage your transactions</p>
          {deletionsLastWeek > 0 && (
            <p className="text-sm text-orange-600 mt-2 flex items-center space-x-1">
              <AlertTriangle className="h-4 w-4" />
              <span>{deletionsLastWeek} transaction(s) deleted in the last 7 days</span>
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading transactions...</div>
        ) : filteredTransactions.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction._id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        {transaction.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')} • {transaction.source}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p
                      className={`text-lg font-semibold ${
                        transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                    </p>
                    <button
                      onClick={() => handleDelete(transaction)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete transaction"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No transactions found. Upload a statement to get started!
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Delete Transaction</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
                <button
                  onClick={cancelDelete}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Description:</span>
                    <span className="text-sm font-medium text-gray-900">{deleteConfirm.description}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className={`text-sm font-semibold ${
                      deleteConfirm.type === 'expense' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {deleteConfirm.type === 'expense' ? '-' : '+'}{formatCurrency(deleteConfirm.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Category:</span>
                    <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                      {deleteConfirm.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Date:</span>
                    <span className="text-sm text-gray-900">
                      {format(new Date(deleteConfirm.date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={cancelDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

