import { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import api from '../utils/axiosConfig'
import { Upload as UploadIcon, FileText, CheckCircle, AlertCircle, Eye, Clock, FileUp } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { fetchTransactions } from '../store/slices/transactionSlice'
import { fetchInsights } from '../store/slices/insightSlice'
import { format, formatDistanceToNow } from 'date-fns'
import { useToast } from '../contexts/ToastContext'

export default function Upload() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [uploadHistory, setUploadHistory] = useState([])
  const [totalUploads, setTotalUploads] = useState(0)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [previewFile, setPreviewFile] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  
  // Version check
  console.log('📋 Upload component loaded - Version: TXT-ONLY v2.0')

  // Fetch upload history
  useEffect(() => {
    fetchUploadHistory()
  }, [])

  const fetchUploadHistory = async () => {
    try {
      setLoadingHistory(true)
      const response = await api.get('/upload/history?limit=10')
      console.log('Upload history response:', response.data)
      setUploadHistory(response.data.uploads || [])
      setTotalUploads(response.data.totalUploads || 0)
    } catch (error) {
      console.error('Error fetching upload history:', error)
      console.error('Error response:', error.response?.data)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handlePreview = async (uploadId) => {
    try {
      setLoadingPreview(true)
      const response = await api.get(`/upload/history/${uploadId}/preview`)
      setPreviewFile(response.data)
    } catch (error) {
      console.error('Error fetching preview:', error)
      setPreviewFile({ error: 'Failed to load preview' })
    } finally {
      setLoadingPreview(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    
    // Validate file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'txt') {
      setUploadStatus({
        type: 'error',
        message: `File "${file.name}" is not a TXT file. Only TXT files are allowed.`,
      });
      showToast(`File "${file.name}" is not a TXT file. Only TXT files are allowed.`, 'error', 4000);
      return;
    }
    
    // Check if file was already uploaded (client-side check)
    const existingFile = uploadHistory.find(upload => 
      upload.originalFileName === file.name && 
      upload.fileSize === file.size &&
      upload.status === 'success'
    );
    
    if (existingFile) {
      const uploadDate = new Date(existingFile.uploadDate);
      const errorMessage = `This file has already been uploaded!\n\n` +
        `File: "${file.name}"\n` +
        `Previously uploaded: ${format(uploadDate, 'MMM dd, yyyy HH:mm')}\n` +
        `Transactions processed: ${existingFile.transactionsCount}\n\n` +
        `Please upload a different file.`;
      
      setUploadStatus({
        type: 'error',
        message: errorMessage,
      });
      
      showToast(`File "${file.name}" has already been uploaded. Please use a different file.`, 'error', 6000);
      return;
    }
    
    setUploading(true)
    setUploadStatus(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      // Use the configured axios instance which handles auth automatically
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const successMessage = `File uploaded successfully! Processed ${response.data.transactionsCount} transactions.`
      
      setUploadStatus({
        type: 'success',
        message: successMessage,
      })

      // Show toast notification with progress bar
      showToast(successMessage, 'success', 3000)

      // Refresh transactions and insights
      dispatch(fetchTransactions())
      dispatch(fetchInsights())
      
      // Refresh upload history after a short delay to ensure backend has saved it
      setTimeout(() => {
        fetchUploadHistory()
      }, 500)

      // Show redirect message and navigate to Insights page
      setTimeout(() => {
        showToast('Redirecting to Insights page...', 'success', 2000)
      }, 2000)

      setTimeout(() => {
        navigate('/insights')
      }, 3000)
    } catch (error) {
      // Get detailed error message from response
      const errorData = error.response?.data;
      const isDuplicate = error.response?.status === 409;
      
      let errorMessage = errorData?.error || errorData?.message || error.message || 'Failed to upload file';
      
      // Enhanced message for duplicate files
      if (isDuplicate && errorData?.existingUpload) {
        const uploadDate = new Date(errorData.existingUpload.uploadDate);
        errorMessage = `This file has already been uploaded!\n\n` +
          `File: "${file.name}"\n` +
          `Previously uploaded: ${format(uploadDate, 'MMM dd, yyyy HH:mm')}\n` +
          `Transactions processed: ${errorData.existingUpload.transactionsCount}\n\n` +
          `Please upload a different file.`;
      }
      
      setUploadStatus({
        type: 'error',
        message: errorMessage,
      })

      // Show error toast notification
      showToast(isDuplicate ? `File "${file.name}" has already been uploaded. Please use a different file.` : errorMessage, 'error', 6000)
    } finally {
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles, fileRejections) => {
      // Handle rejected files
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        const fileName = rejection.file?.name || 'file';
        const fileExt = fileName.split('.').pop()?.toLowerCase();
        
        // Check extension - if .txt, try to accept it anyway
        if (fileExt === 'txt') {
          console.log('TXT file rejected by dropzone, but extension is .txt. Accepting anyway...');
          await onDrop([rejection.file]);
          return;
        }
        
        // Not a .txt file
        setUploadStatus({
          type: 'error',
          message: `File "${fileName}" rejected. Only TXT files are allowed.`,
        });
        return;
      }
      
      // Handle accepted files
      if (acceptedFiles.length === 0) return;
      await onDrop(acceptedFiles);
    },
    // Only accept .txt files by extension
    accept: {
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: uploading,
    // Custom validator to check file extension
    validator: (file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'txt') {
        return {
          code: 'file-invalid-type',
          message: 'Only TXT files are allowed.'
        };
      }
      return null;
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Statement</h1>
        <p className="text-gray-600 mt-1">Upload your bank statement in TXT format</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center">
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                <p className="text-gray-600">Processing file...</p>
              </>
            ) : (
              <>
                <UploadIcon className="h-12 w-12 text-gray-400 mb-4" />
                {isDragActive ? (
                  <p className="text-lg font-medium text-primary-600">Drop the file here</p>
                ) : (
                  <>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Drag & drop your statement here
                    </p>
                    <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                    <p className="text-xs text-gray-400">Supports TXT files (max 10MB)</p>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {uploadStatus && (
          <div
            className={`mt-6 p-4 rounded-lg ${
              uploadStatus.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            <div className="flex items-start space-x-3">
              {uploadStatus.type === 'success' ? (
                <CheckCircle className="h-5 w-5 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="whitespace-pre-line">{uploadStatus.message}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">File Format Guidelines</h3>
          <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-gray-900">TXT Format ✅ Required</h4>
            </div>
            <p className="text-sm text-gray-700 mb-2 font-medium">
              Upload your bank statement as a TXT file. The file should be space-delimited or fixed-width format.
            </p>
            <p className="text-xs text-gray-600 mb-3">
              💡 Your TXT file should have columns for Date, Description/Narration, Debit Amount, and Credit Amount.
            </p>
            <div className="mt-3 p-3 bg-white rounded border border-green-300">
              <p className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
{`Example format:
Date     ,Narration     ,Value Dat,Debit Amount,Credit Amount
04/12/25  ,UPI-OPENAI LLC,04/12/25 ,    1.00    ,    0.00`}
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">📋 How to Prepare Your TXT File</h4>
            <p className="text-sm text-blue-800 mb-2">
              Your TXT file should be space-delimited (2+ spaces between columns) or fixed-width format with:
            </p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside mb-3">
              <li><strong>Date</strong> column (format: DD/MM/YY or DD/MM/YYYY)</li>
              <li><strong>Description/Narration</strong> column</li>
              <li><strong>Debit Amount</strong> column (for expenses)</li>
              <li><strong>Credit Amount</strong> column (for income)</li>
            </ul>
            <p className="text-xs text-blue-700 italic">
              The parser automatically detects column positions and handles various formats.
            </p>
          </div>
        </div>
      </div>

      {/* Last Uploads Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Last Uploads</h2>
            <p className="text-sm text-gray-600 mt-1">
              Total uploads: <span className="font-semibold">{totalUploads}</span>
            </p>
          </div>
        </div>

        {loadingHistory ? (
          <div className="text-center py-8 text-gray-500">Loading upload history...</div>
        ) : uploadHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileUp className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No uploads yet. Upload your first statement to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {uploadHistory.map((upload) => (
              <div
                key={upload._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <FileText className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{upload.originalFileName}</p>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(upload.uploadDate), { addSuffix: true })}</span>
                      </span>
                      <span className="text-gray-400">•</span>
                      <span>{formatFileSize(upload.fileSize)}</span>
                      <span className="text-gray-400">•</span>
                      <span>{upload.transactionsCount} transactions</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(upload.uploadDate), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {upload.status === 'success' && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Success</span>
                  )}
                  {upload.status === 'failed' && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded" title={upload.errorMessage || 'Upload failed'}>
                      Failed
                    </span>
                  )}
                  {upload.status === 'processing' && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">Processing</span>
                  )}
                  <button
                    onClick={() => handlePreview(upload._id)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Preview file"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">File Preview</h3>
                <p className="text-sm text-gray-600 mt-1">{previewFile.fileName}</p>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {loadingPreview ? (
                <div className="text-center py-8 text-gray-500">Loading preview...</div>
              ) : previewFile.error ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-500" />
                  <p className="text-red-600 font-medium">{previewFile.error}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {previewFile.fileContent ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto max-h-96">
                        {previewFile.fileContent}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>Content not available</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            {previewFile.uploadDate && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Uploaded: {format(new Date(previewFile.uploadDate), 'MMM dd, yyyy HH:mm:ss')}
                  </span>
                  {previewFile.transactionsCount && (
                    <span>{previewFile.transactionsCount} transactions processed</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

