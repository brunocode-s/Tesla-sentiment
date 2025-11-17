# train_model.py
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

# Sample data for testing
tweets = [
    "I love this product!",
    "This is terrible.",
    "Absolutely fantastic experience.",
    "I hate it.",
    "Not bad at all."
]

labels = [1, 0, 1, 0, 1]  # 1=positive, 0=negative

# Create vectorizer and transform tweets
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(tweets)

# Train a simple model
model = LogisticRegression()
model.fit(X, labels)

# Save artifacts
with open("artifacts/vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)

with open("artifacts/model.pkl", "wb") as f:
    pickle.dump(model, f)

print("✅ Training complete. Artifacts saved.")
