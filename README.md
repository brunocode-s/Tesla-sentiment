# Tesla Tweet Sentiment Analyzer

A full-stack sentiment analysis application that analyzes Tesla-related tweets using a hybrid machine learning model combining VADER sentiment analysis and Logistic Regression with TF-IDF vectorization.

![Tesla Sentiment Analyzer](https://img.shields.io/badge/Python-3.8+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)
![React](https://img.shields.io/badge/React-18+-61DAFB.svg)

## Features

- **Hybrid Sentiment Analysis**: Combines VADER (lexicon-based) and Logistic Regression (ML-based) for accurate predictions
- **Interactive Web Interface**: Beautiful React-based UI with real-time analysis
- **File Upload Support**: Upload Excel (.xlsx, .xls) or CSV files
- **Visual Analytics**: 
  - Summary statistics cards
  - Horizontal distribution bar
  - Vertical bar chart comparison
  - Detailed results table with confidence scores
- **Export Functionality**: Download comprehensive Excel reports with analysis details
- **Real-time Backend Health Check**: Monitor API connectivity and model status

## Prerequisites

### Backend Requirements
- Python 3.8 or higher
- pip (Python package manager)

### Frontend Requirements
- Node.js 14 or higher
- npm or yarn

## Installation

### 1. Clone the Repository
```bash
https://github.com/brunocode-s/Tesla-sentiment.git
cd tesla-sentiment-analyzer
```

### 2. Backend Setup

#### Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Download NLTK Data
The VADER lexicon will be automatically downloaded on first run, but you can manually download it:
```python
import nltk
nltk.download('vader_lexicon')
```

#### Project Structure
```
backend/
├── main.py                 # FastAPI application
├── artifacts/
│   ├── vectorizer.pkl     # TF-IDF vectorizer
│   └── model.pkl          # Trained Logistic Regression model
└── requirements.txt
```

**Required Python Packages** (`requirements.txt`):
```
fastapi==0.100.0
uvicorn[standard]==0.23.0
pydantic==2.0.0
nltk==3.8.1
scikit-learn==1.3.0
pandas==2.0.3
openpyxl==3.1.2
```

### 3. Frontend Setup

#### Install Node Dependencies
```bash
cd frontend
npm install
```

**Required NPM Packages**:
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "styled-components": "^6.0.0",
    "lucide-react": "^0.263.1",
    "xlsx": "^0.18.5"
  }
}
```

## Running the Application

### 1. Start the Backend Server
```bash
cd backend
python main.py
```

The FastAPI server will start at `http://127.0.0.1:8000`

You can access:
- **API Documentation**: http://127.0.0.1:8000/docs
- **Health Check**: http://127.0.0.1:8000/health

### 2. Start the Frontend Development Server
```bash
cd frontend
npm start
```

The React app will start at `http://localhost:3000`

## 📖 Usage

### Step 1: Prepare Your Data
Create an Excel or CSV file with tweets in the **first column**. Example format:

| Tweet Text |
|------------|
| Tesla's new model is amazing! |
| Disappointed with the customer service |
| Love my Tesla, best car ever! |

### Step 2: Upload File
1. Open the web application at `http://localhost:3000`
2. Click the upload area or drag and drop your file
3. Supported formats: `.xlsx`, `.xls`, `.csv`

### Step 3: View Results
The application will display:
- **Total Tweets**: Count of analyzed tweets
- **Positive Sentiment**: Count and percentage
- **Negative Sentiment**: Count and percentage
- **Distribution Bar**: Visual percentage comparison
- **Vertical Bar Chart**: Side-by-side sentiment comparison
- **Detailed Table**: Individual tweet results with confidence scores

### Step 4: Download Report
Click the "Download Full Report" button to get an Excel file containing:
- Original tweet text
- VADER prediction
- Logistic Regression prediction
- Final hybrid prediction
- Confidence score

## How the Hybrid Model Works

### 1. VADER Sentiment Analysis
- Lexicon-based approach
- Analyzes text for sentiment-bearing words
- Returns compound score: 
  - `≥ 0.05` = Positive
  - `≤ -0.05` = Negative
  - Between = Neutral

### 2. Logistic Regression with TF-IDF
- Machine learning approach
- Text is cleaned (removes URLs, mentions, hashtags)
- TF-IDF vectorization converts text to numerical features
- Logistic Regression predicts sentiment
- Returns probability score (0-1)

### 3. Hybrid Fusion Logic
```python
if VADER prediction == "neutral":
    final_prediction = Logistic_Regression_prediction
else:
    final_prediction = VADER_prediction
```

This approach leverages VADER's strength in handling explicit sentiment while falling back to ML for neutral/ambiguous cases.

## API Endpoints

### `GET /`
Returns API information and available endpoints

### `GET /health`
Health check endpoint showing:
- Backend status
- Hybrid model readiness
- Artifacts existence

### `POST /analyze`
Analyzes sentiment of tweets

**Request Body**:
```json
{
  "tweets": [
    { "text": "Tesla is awesome!" },
    { "text": "Not happy with service" }
  ]
}
```

**Response**:
```json
{
  "data": [
    {
      "tweet": "Tesla is awesome!",
      "sentiment": "positive",
      "score": 0.89
    },
    {
      "tweet": "Not happy with service",
      "sentiment": "negative",
      "score": 0.23
    }
  ]
}
```

### `POST /download`
Generates and downloads Excel report with detailed analysis

**Request Body**: Same as `/analyze`

**Response**: Excel file download

## 📁 File Structure

```
tesla-sentiment-analyzer/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── artifacts/
│   │   ├── vectorizer.pkl     # TF-IDF vectorizer
│   │   └── model.pkl          # Logistic Regression model
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.js             # React sentiment analyzer component
│   │   └── index.js
│   ├── public/
│   └── package.json
└── README.md
```

## Tech Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **NLTK**: Natural Language Toolkit for VADER
- **scikit-learn**: Machine learning library for Logistic Regression
- **pandas**: Data manipulation and Excel export
- **openpyxl**: Excel file creation

### Frontend
- **React**: UI library
- **styled-components**: CSS-in-JS styling
- **lucide-react**: Icon library
- **xlsx**: Excel file parsing

## Troubleshooting

### Backend Issues

**Model files not found**
- Ensure `vectorizer.pkl` and `model.pkl` are in the `backend/artifacts/` directory
- Check file permissions

**VADER lexicon error**
```bash
python -c "import nltk; nltk.download('vader_lexicon')"
```

**Port 8000 already in use**
```bash
# Change port in main.py
uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
```

### Frontend Issues

**CORS errors**
- Ensure backend is running
- Check that backend URL in frontend matches: `http://127.0.0.1:8000`

**File upload not working**
- Verify file format (first column contains text)
- Check browser console for error messages
- Ensure file is not empty

**Backend connection failed**
- Verify backend server is running on port 8000
- Check the status badge at the top of the page
- Review browser network tab for failed requests

## Model Training (Optional)

If you want to retrain the model with your own data:

1. Prepare training data with tweets and labels (0=negative, 1=positive)
2. Train TF-IDF vectorizer and Logistic Regression model
3. Save models using pickle:
```python
import pickle

# Save vectorizer
with open('artifacts/vectorizer.pkl', 'wb') as f:
    pickle.dump(vectorizer, f)

# Save model
with open('artifacts/model.pkl', 'wb') as f:
    pickle.dump(model, f)
```


k

