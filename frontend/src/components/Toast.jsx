import { useEffect, useState } from 'react'
import { CheckCircle, X, Loader2 } from 'lucide-react'

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  const [progress, setProgress] = useState(100)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Animate progress bar
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval)
          return 0
        }
        return prev - (100 / (duration / 50))
      })
    }, 50)

    // Auto close after duration
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(), 300) // Wait for fade out animation
    }, duration)

    return () => {
      clearInterval(interval)
      clearTimeout(timer)
    }
  }, [duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(), 300)
  }

  const bgColor = type === 'success' 
    ? 'bg-green-500' 
    : type === 'error' 
    ? 'bg-red-500' 
    : 'bg-blue-500'

  const borderColor = type === 'success'
    ? 'border-green-600'
    : type === 'error'
    ? 'border-red-600'
    : 'border-blue-600'

  return (
    <div
      className={`relative min-w-[320px] max-w-md transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      <div
        className={`bg-white rounded-lg shadow-2xl border-2 ${borderColor} overflow-hidden animate-slide-in-left`}
      >
        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div
            className={`h-full ${bgColor} transition-all duration-50 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-4 flex items-start space-x-3">
          {type === 'loading' ? (
            <Loader2 className="h-5 w-5 text-primary-600 animate-spin flex-shrink-0 mt-0.5" />
          ) : type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{message}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

