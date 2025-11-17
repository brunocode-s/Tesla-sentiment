from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import pickle
import re
import os
import pandas as pd
from io import BytesIO
from typing import List

# VADER imports
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

import matplotlib.pyplot as plt
from fastapi.responses import FileResponse
import uuid

app = FastAPI(title="Tesla Sentiment Analysis API (Hybrid Model)")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to artifacts
ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")

# Global variables
vectorizer = None
model = None
vader = None
HYBRID_READY = False


# --------------------------------------------------------------------
#                LOAD ARTIFACTS + INITIALIZE HYBRID MODEL
# --------------------------------------------------------------------
def load_artifacts():
    """Load TF-IDF vectorizer, Logistic Regression model, and VADER."""
    global vectorizer, model, vader, HYBRID_READY

    try:
        nltk.download("vader_lexicon")

        # Load VADER
        vader = SentimentIntensityAnalyzer()

        # Load TF-IDF vectorizer
        vectorizer_path = os.path.join(ARTIFACTS_DIR, "vectorizer.pkl")
        print(f"Loading vectorizer from: {vectorizer_path}")
        with open(vectorizer_path, "rb") as f:
            vectorizer = pickle.load(f)

        # Load Logistic Regression Model
        model_path = os.path.join(ARTIFACTS_DIR, "model.pkl")
        print(f"Loading model from: {model_path}")
        with open(model_path, "rb") as f:
            model = pickle.load(f)

        HYBRID_READY = True
        print("✅ Hybrid Model Loaded: VADER + Logistic Regression + TF-IDF")
        return True

    except Exception as e:
        print("❌ Error loading hybrid model:", str(e))
        HYBRID_READY = False
        return False


@app.on_event("startup")
async def startup_event():
    success = load_artifacts()
    if not success:
        print("⚠️ WARNING: Hybrid model not loaded! /analyze will not work.")


# --------------------------------------------------------------------
#                       CLEANING FUNCTION
# --------------------------------------------------------------------
def clean_text(text: str) -> str:
    """Clean tweet text (same as in notebook)"""
    clean = re.compile(
        r"(https?://\S+)|"   # URLs
        r"(@\w+)|"           # @mentions
        r"(#\w+)|"           # hashtags
        r"[^A-Za-z\s]"       # non-letters
    )
    text = text.lower()
    text = clean.sub(" ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def generate_sentiment_chart(positive: int, negative: int):
    """Generate a bar chart for sentiment counts and return file path."""
    
    filename = f"sentiment_chart_{uuid.uuid4().hex}.png"
    filepath = f"/tmp/{filename}"

    plt.figure(figsize=(8, 6))
    categories = ["Positive", "Negative"]
    values = [positive, negative]

    plt.bar(categories, values)
    plt.title("Tweet Sentiment Count")
    plt.xlabel("Sentiment")
    plt.ylabel("Number of Tweets")

    plt.tight_layout()
    plt.savefig(filepath)
    plt.close()

    return filepath

# --------------------------------------------------------------------
#                       REQUEST MODELS
# --------------------------------------------------------------------
class TweetItem(BaseModel):
    text: str

class AnalyzeRequest(BaseModel):
    tweets: List[TweetItem]


# --------------------------------------------------------------------
#                     ROOT + HEALTH ENDPOINTS
# --------------------------------------------------------------------
@app.get("/")
async def root():
    return {
        "message": "Hybrid Tesla Sentiment API Running",
        "hybrid_loaded": HYBRID_READY,
        "endpoints": {
            "docs": "/docs",
            "analyze": "/analyze (POST)",
            "download": "/download (POST)",
        }
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "hybrid_ready": HYBRID_READY,
        "artifacts_path": ARTIFACTS_DIR,
        "vectorizer_exists": os.path.exists(os.path.join(ARTIFACTS_DIR, "vectorizer.pkl")),
        "model_exists": os.path.exists(os.path.join(ARTIFACTS_DIR, "model.pkl"))
    }


# --------------------------------------------------------------------
#                          HYBRID ANALYSIS
# --------------------------------------------------------------------
def hybrid_predict(text):
    """Combine VADER + Logistic Regression prediction."""

    # 1. VADER
    vader_scores = vader.polarity_scores(text)
    vader_label = (
        "positive" if vader_scores["compound"] >= 0.05 else
        "negative" if vader_scores["compound"] <= -0.05 else
        "neutral"
    )

    # 2. Logistic Regression (TF-IDF)
    cleaned = clean_text(text)
    X = vectorizer.transform([cleaned])
    lr_pred = model.predict(X)[0]
    lr_prob = model.predict_proba(X)[0][1]  # probability of positive

    lr_label = "positive" if lr_pred == 1 else "negative"

    # 3. Hybrid fusion logic
    if vader_label == "neutral":
        final_label = lr_label
    else:
        final_label = vader_label

    return {
        "vader": vader_label,
        "logreg": lr_label,
        "logreg_score": float(lr_prob),
        "final": final_label
    }


# --------------------------------------------------------------------
#                        /analyze ENDPOINT
# --------------------------------------------------------------------
@app.post("/analyze")
async def analyze_tweets(payload: AnalyzeRequest):
    """
    Analyze tweets using the hybrid model, returning:
    { "data": [{ "tweet": ..., "sentiment": ..., "score": ... }, ...] }
    """
    if not HYBRID_READY:
        raise HTTPException(status_code=503, detail="Hybrid model not loaded. Check backend logs.")

    results = []
    for item in payload.tweets:
        hybrid_result = hybrid_predict(item.text)
        results.append({
            "tweet": item.text,
            "sentiment": hybrid_result["final"],  
            "score": hybrid_result["logreg_score"]    
        })

    return {"data": results}

# --------------------------------------------------------------------
#                        /download ENDPOINT
# --------------------------------------------------------------------
@app.post("/download")
async def download_excel(req: AnalyzeRequest):

    if not HYBRID_READY:
        raise HTTPException(503, "Hybrid model not loaded.")

    rows = []

    for item in req.tweets:
        res = hybrid_predict(item.text)
        rows.append({
            "Tweet": item.text,
            "VADER": res["vader"],
            "LogisticRegression": res["logreg"],
            "Final_Prediction": res["final"],
            "LogReg_Confidence": f"{res['logreg_score']:.2%}",
            "Raw_LR_Score": res["logreg_score"],
        })

    df = pd.DataFrame(rows)

    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Sentiment Analysis")

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=sentiment_analysis.xlsx"}
    )


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Tesla Hybrid Sentiment API...")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

@app.post("/download-chart")
async def download_chart(req: AnalyzeRequest):

    if not HYBRID_READY:
        raise HTTPException(503, "Hybrid model not loaded.")

    positive = 0
    negative = 0

    # Count sentiments
    for item in req.tweets:
        result = hybrid_predict(item.text)
        if result["final"] == "positive":
            positive += 1
        else:
            negative += 1

    # Generate chart
    file_path = generate_sentiment_chart(positive, negative)

    return FileResponse(
        file_path,
        media_type="image/png",
        filename="sentiment_chart.png"
    )
