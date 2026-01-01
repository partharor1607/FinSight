import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const API_URL = '/api'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}

export const fetchInsights = createAsyncThunk(
  'insights/fetch',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/insights`, {
        ...getAuthHeaders(),
        params,
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch insights')
    }
  }
)

export const fetchTrends = createAsyncThunk(
  'insights/trends',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/insights/trends`, {
        ...getAuthHeaders(),
        params,
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch trends')
    }
  }
)

const initialState = {
  insights: null,
  trends: null,
  loading: false,
  error: null,
}

const insightSlice = createSlice({
  name: 'insights',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInsights.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchInsights.fulfilled, (state, action) => {
        state.loading = false
        state.insights = action.payload
      })
      .addCase(fetchInsights.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchTrends.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchTrends.fulfilled, (state, action) => {
        state.loading = false
        state.trends = action.payload
      })
      .addCase(fetchTrends.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError } = insightSlice.actions
export default insightSlice.reducer

