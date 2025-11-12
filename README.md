# Cognitax - Tax Management Platform

## 📋 Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Running the Application](#running-the-application)
8. [Project Structure](#project-structure)
9. [API Endpoints](#api-endpoints)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Cognitax is a comprehensive tax management platform designed to help users analyze bank statements, track transactions, calculate taxes, and manage their financial data efficiently. Built with modern technologies, it offers AI-powered insights and professional reporting capabilities.

**Author:** Vishal  
**Version:** 1.0

---

## ✨ Features

### Core Features
- 🏦 **Multi-file Bank Statement Upload** - Upload and process multiple PDF bank statements simultaneously
- 📊 **Advanced Analytics** - Interactive charts and visualizations (Area, Pie, Bar charts)
- 💰 **Tax Calculations** - Automated GST, ITR, and TDS calculations
- 📈 **Transaction Management** - Search, filter, and bulk operations on transactions
- 📄 **Report Generation** - Export data in PDF, Excel, and CSV formats
- 🤖 **AI Assistant** - Gemini-powered chatbot for financial insights
- 📰 **Indian Taxation News** - Latest updates from Income Tax Department and GST Council
- 🌓 **Dark Mode** - Professional light and dark themes
- 📱 **Responsive Design** - Works seamlessly on all devices

### Advanced Features
- **Date Range Filtering** - Filter transactions by custom date ranges
- **Amount Range Filtering** - Filter by minimum and maximum amount
- **Bulk Operations** - Select and delete multiple transactions
- **Multi-file Management** - Review and remove files before processing
- **Session Management** - Clean state on logout
- **Custom Date Range Reports** - Generate reports for specific periods

---

## 🛠 Tech Stack

### Frontend
- **React 19** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Recharts** - Chart library for data visualization
- **jsPDF & jsPDF-AutoTable** - PDF generation
- **XLSX** - Excel file generation
- **Lucide React** - Icon library
- **Axios** - HTTP client

### Backend
- **FastAPI** - Modern Python web framework
- **Python 3.9+** - Programming language
- **MongoDB** - NoSQL database
- **PyPDF2** - PDF processing
- **Google Gemini AI** - AI chatbot integration
- **Pydantic** - Data validation
- **Motor** - Async MongoDB driver

---

## 📦 Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **Yarn** (v1.22+) - `npm install -g yarn`
- **Python** (v3.9 or higher) - [Download](https://python.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)

---

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/vishalbg02/Cognitax
cd cognitax
```

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### Step 3: Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install Node dependencies
yarn install
```

---

## ⚙️ Configuration

### Backend Configuration

Create a `.env` file in the `backend` directory:

```env
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017/cognitax

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google Gemini AI API Key
GEMINI_API_KEY=your-gemini-api-key-here

# Server Configuration
HOST=0.0.0.0
PORT=8001
```

### Frontend Configuration

Create a `.env` file in the `frontend` directory:

```env
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:8001

# Optional: Enable visual edits
REACT_APP_ENABLE_VISUAL_EDITS=false
```

### Getting API Keys

#### Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your backend `.env` file

---

## 🏃 Running the Application

### Method 1: Using Supervisor (Recommended for Production)

The application uses supervisor to manage both frontend and backend services.

```bash
# Start all services
sudo supervisorctl start all

# Check status
sudo supervisorctl status

# Restart services
sudo supervisorctl restart all

# Stop all services
sudo supervisorctl stop all

# View logs
tail -f /var/log/supervisor/backend.out.log
tail -f /var/log/supervisor/frontend.out.log
```

### Method 2: Manual Development Setup

#### Terminal 1: Start MongoDB

```bash
# On Mac (using Homebrew)
brew services start mongodb-community

# On Ubuntu/Linux
sudo systemctl start mongod

# On Windows
net start MongoDB
```

#### Terminal 2: Start Backend

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

Backend will be available at: `http://localhost:8001`  
API documentation: `http://localhost:8001/docs`

#### Terminal 3: Start Frontend

```bash
cd frontend
yarn start
```

Frontend will be available at: `http://localhost:3000`

---

## 📁 Project Structure

```
cognitax/
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── models.py              # Database models
│   ├── utils/                 # Utility functions
│   │   ├── pdf_parser.py      # PDF processing
│   │   ├── tax_calculator.py  # Tax calculations
│   │   └── gemini_chat.py     # AI chatbot
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Backend configuration
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EnhancedDashboard.js  # Main dashboard
│   │   │   ├── AuthPage.js           # Authentication
│   │   │   ├── LandingPage.js        # Landing page
│   │   │   └── ui/                   # Reusable UI components
│   │   ├── context/
│   │   │   └── ThemeContext.js       # Theme management
│   │   ├── App.js             # Main React component
│   │   └── index.js           # React entry point
│   ├── public/
│   │   └── index.html         # HTML template
│   ├── package.json           # Node dependencies
│   └── .env                   # Frontend configuration
│
├── test_result.md             # Testing documentation
├── SETUP_GUIDE.md             # This file
└── README.md                  # Project overview
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/{id}` - Get single transaction
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/{id}` - Update transaction
- `DELETE /api/transactions/{id}` - Delete transaction

### Analytics
- `GET /api/analytics` - Get financial analytics
- `GET /api/analytics/category` - Category breakdown
- `GET /api/analytics/monthly` - Monthly trends

### Upload
- `POST /api/upload-pdf` - Upload bank statement PDF
- `GET /api/uploads` - Get upload history

### Tax
- `POST /api/calculate-tax` - Calculate taxes
- `GET /api/tax-calculations` - Get tax history

### Chat
- `POST /api/chat` - Send message to AI assistant
- `GET /api/chat/history/{session_id}` - Get chat history

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Frontend not connecting to backend

**Problem:** "Failed to load data" error or network errors

**Solution:**
- Check if backend is running: `curl http://localhost:8001/health`
- Verify `REACT_APP_BACKEND_URL` in frontend `.env`
- Ensure backend has CORS properly configured
- Check browser console for detailed errors

#### 2. MongoDB connection errors

**Problem:** "MongoClient connection failed"

**Solution:**
- Ensure MongoDB is running: `mongo --eval "db.version()"`
- Check `MONGO_URL` in backend `.env`
- Verify MongoDB is listening on port 27017
- Check MongoDB logs: `tail -f /var/log/mongodb/mongod.log`

#### 3. PDF upload fails

**Problem:** "Failed to process PDF" error

**Solution:**
- Ensure file is a valid PDF
- Check file size (max 10MB recommended)
- Verify PyPDF2 is installed: `pip show PyPDF2`
- Check backend logs for detailed error

#### 4. AI Chatbot not responding

**Problem:** Chat returns errors or timeouts

**Solution:**
- Verify `GEMINI_API_KEY` is set correctly
- Check API key has not exceeded quota
- Test API key: Visit [Google AI Studio](https://makersuite.google.com/)
- Check backend logs for API errors

#### 5. Dark mode not working

**Problem:** Theme toggle doesn't switch colors

**Solution:**
- Clear browser cache and localStorage
- Check ThemeContext is properly imported
- Verify Tailwind dark mode is configured
- Inspect element to check if dark classes are applied

#### 6. Reports not generating

**Problem:** PDF/Excel export fails

**Solution:**
- Check browser console for errors
- Verify jsPDF and xlsx libraries are installed: `yarn list jspdf xlsx`
- Ensure popup blocker is disabled
- Try with smaller dataset first

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong JWT secrets** in production
3. **Enable HTTPS** for production deployment
4. **Implement rate limiting** on API endpoints
5. **Validate all user inputs** on both frontend and backend
6. **Keep dependencies updated** regularly
7. **Use environment-specific configurations**

---

## 📊 Performance Optimization

### Frontend
- Lazy load components using React.lazy()
- Implement pagination for large transaction lists
- Use React.memo() for expensive components
- Optimize images and assets

### Backend
- Index MongoDB collections appropriately
- Implement caching for frequently accessed data
- Use async operations for I/O bound tasks
- Optimize database queries

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
yarn test
```

---

## 📦 Building for Production

### Frontend Build
```bash
cd frontend
yarn build
```

The build artifacts will be in the `frontend/build` directory.

### Backend Deployment
Ensure all environment variables are set and use a production WSGI server:

```bash
cd backend
gunicorn server:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👤 Author

**Vishal**

For support or queries, please create an issue in the repository.

---

## 🙏 Acknowledgments

- React team for the amazing framework
- FastAPI team for the excellent Python framework
- Tailwind CSS for the utility-first CSS framework
- Radix UI for accessible components
- Google for Gemini AI API
- All open-source contributors

---

## 📮 Support

If you encounter any issues or have questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review existing issues in the repository
3. Create a new issue with detailed information
4. Contact the development team

---

**Happy Coding! 🚀**
