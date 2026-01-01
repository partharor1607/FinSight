# FinSight - AI-Powered Expense Intelligence Platform

A comprehensive financial management platform that uses AI to automatically categorize expenses, analyze spending patterns, and provide personalized financial insights.

## Features

- 📄 **File Upload**: Upload bank statements in CSV or PDF format
- 🤖 **AI Categorization**: Automatic expense categorization using OpenAI GPT or keyword matching
- 📊 **Financial Insights**: Monthly trends, category breakdowns, and spending analysis
- 💡 **AI-Generated Advice**: Personalized financial recommendations based on your spending patterns
- 🔔 **Smart Alerts**: Notifications for unusual spending, budget overruns, and financial health
- 📱 **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS

## Tech Stack

### Backend
- **Node.js** + **Express**: RESTful API server
- **MongoDB** + **Mongoose**: Database and ODM
- **OpenAI API**: AI-powered categorization and advice generation
- **Multer**: File upload handling
- **pdf-parse**: PDF statement parsing
- **csv-parser**: CSV file processing

### Frontend
- **React 18**: Modern UI framework
- **Redux Toolkit**: State management
- **React Router**: Navigation
- **Tailwind CSS**: Styling
- **Recharts**: Data visualization
- **Vite**: Build tool and dev server

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- OpenAI API key (optional, for AI features)

### Installation

1. **Clone the repository**
   ```bash
   cd "FinSight – AI-Powered Expense Intelligence Platform"
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/finsight
   JWT_SECRET=your_jwt_secret_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   NODE_ENV=development
   ```

5. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

6. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

7. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```

8. **Open your browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
FinSight – AI-Powered Expense Intelligence Platform/
├── backend/
│   ├── models/          # MongoDB models (User, Transaction, Category)
│   ├── routes/          # API routes (auth, transactions, upload, insights)
│   ├── services/        # Business logic (fileParser, aiCategorizer)
│   ├── middleware/      # Auth middleware
│   ├── uploads/         # Temporary file storage
│   └── server.js        # Express server entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── pages/       # Page components
│   │   ├── store/       # Redux store and slices
│   │   └── App.jsx      # Main app component
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Transactions
- `GET /api/transactions` - Get all transactions (with filters)
- `GET /api/transactions/:id` - Get single transaction
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### File Upload
- `POST /api/upload` - Upload CSV/PDF statement

### Insights
- `GET /api/insights` - Get financial insights
- `GET /api/insights/trends` - Get monthly trends

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/stats` - Get category statistics
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

## Usage

1. **Register/Login**: Create an account or sign in
2. **Upload Statement**: Upload your bank statement (CSV or PDF)
3. **View Transactions**: Browse automatically categorized transactions
4. **Explore Insights**: Check AI-generated insights and trends
5. **Get Advice**: Review personalized financial recommendations

## File Format Guidelines

### CSV Format
Your CSV should include columns for:
- Date (various formats supported)
- Description
- Amount

Common column names are automatically detected.

### PDF Format
Bank statement PDFs are automatically parsed. Ensure your statement includes:
- Transaction dates
- Descriptions
- Amounts

## AI Features

The platform uses OpenAI GPT-3.5-turbo for:
- Intelligent expense categorization
- Financial advice generation

If OpenAI API key is not provided, the system falls back to keyword-based categorization.

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server with hot reload
```

## Production Build

### Frontend
```bash
cd frontend
npm run build
```

The built files will be in the `dist/` directory.

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

