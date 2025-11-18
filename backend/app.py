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
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
vader = SentimentIntensityAnalyzer()

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
    """Combine VADER + Logistic Regression prediction + return full scores."""

    # 1. VADER
    vader_scores = vader_full_scores(text)

    # 2. Logistic Regression
    cleaned = clean_text(text)
    X = vectorizer.transform([cleaned])
    lr_pred = model.predict(X)[0]
    lr_prob = model.predict_proba(X)[0][1]

    lr_label = "positive" if lr_pred == 1 else "negative"

    # 3. Hybrid fusion
    if vader_scores["label"] == "neutral":
        final_label = lr_label
    else:
        final_label = vader_scores["label"]

    return {
        "vader": vader_scores,          # full VADER dictionary
        "logreg": lr_label,
        "logreg_score": float(lr_prob),
        "final": final_label
    }


def vader_full_scores(text: str):
    """
    Return full VADER sentiment scores + label.
    """
    scores = vader.polarity_scores(text)
    compound = scores["compound"]

    label = (
        "positive" if compound >= 0.05 else
        "negative" if compound <= -0.05 else
        "neutral"
    )

    return {
        "label": label,
        "compound": compound,
        "pos": scores["pos"],
        "neu": scores["neu"],
        "neg": scores["neg"]
    }


# --------------------------------------------------------------------
#                        /analyze ENDPOINT
# --------------------------------------------------------------------
@app.post("/analyze")
async def analyze_tweets(payload: AnalyzeRequest):

    if not HYBRID_READY:
        raise HTTPException(status_code=503, detail="Hybrid model not loaded.")

    results = []

    for item in payload.tweets:
        res = hybrid_predict(item.text)

        results.append({
            "tweet": item.text,
            "final_sentiment": res["final"],
            "logistic_regression": res["logreg"],
            "logreg_score": res["logreg_score"],
            "vader": res["vader"],  # full VADER scores here
        })

    return {"data": results}

# --------------------------------------------------------------------
#                     /vader-dashboard ENDPOINT
# --------------------------------------------------------------------
@app.post("/vader-dashboard")
async def vader_dashboard(req: AnalyzeRequest):

    if not HYBRID_READY:
        raise HTTPException(503, "Hybrid model not loaded.")

    scores_list = []
    compounds = []
    pos_scores = []
    neu_scores = []
    neg_scores = []

    sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}

    for item in req.tweets:
        vader_res = vader_full_scores(item.text)

        scores_list.append({
            "tweet": item.text,
            "pos": vader_res["pos"],
            "neu": vader_res["neu"],
            "neg": vader_res["neg"],
            "compound": vader_res["compound"],
            "label": vader_res["label"]
        })

        compounds.append(vader_res["compound"])
        pos_scores.append(vader_res["pos"])
        neu_scores.append(vader_res["neu"])
        neg_scores.append(vader_res["neg"])

        sentiment_counts[vader_res["label"]] += 1

    dashboard = {
        "summary": {
            "average_compound": float(sum(compounds) / len(compounds)),
            "average_pos": float(sum(pos_scores) / len(pos_scores)),
            "average_neu": float(sum(neu_scores) / len(neu_scores)),
            "average_neg": float(sum(neg_scores) / len(neg_scores)),
            "total_tweets": len(req.tweets)
        },
        "distribution": sentiment_counts,
        "scores": scores_list,  # full detail for table display
        "compound_values": compounds,
    }

    return dashboard


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
            "VADER_Label": res["vader"]["label"],
            "VADER_Compound": res["vader"]["compound"],
            "VADER_Positive": res["vader"]["pos"],
            "VADER_Neutral": res["vader"]["neu"],
            "VADER_Negative": res["vader"]["neg"],
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
