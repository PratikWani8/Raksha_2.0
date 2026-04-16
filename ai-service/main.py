from fastapi import FastAPI, Body
from pydantic import BaseModel
import pandas as pd
import numpy as np
import requests
from fastapi.middleware.cors import CORSMiddleware
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
import re
from sklearn.naive_bayes import MultinomialNB
from datetime import datetime
import os
import base64
import cv2
from ultralytics import YOLO

app = FastAPI()

# CORS 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HEALTH CHECK
@app.get("/health")
def health():
    return {"status": "AI service running"}

# CRIME PREDICTION 
model = RandomForestRegressor()

def load_data():

    response = requests.get("http://localhost:5000/api/heatmap")

    data = response.json()

    rows = []

    for item in data:

        lat = item["lat"]
        lng = item["lng"]
        count = item["count"]

        hour = datetime.now().hour

        rows.append([lat,lng,hour,count])

    df = pd.DataFrame(rows,columns=["lat","lng","hour","count"])

    X = df[["lat","lng","hour"]]
    y = df["count"]

    return X,y

def train_model():

    X,y = load_data()

    if len(X) > 0:
        model.fit(X,y)

train_model()

# LOCATION SCHEMA FOR PREDICTION
class Location(BaseModel):
    lat: float
    lng: float

@app.post("/predict")

def predict(location: Location):

    hour = datetime.now().hour

    X = np.array([[location.lat,location.lng,hour]])

    risk = model.predict(X)[0]

    score = min(1,risk/10)

    return {"risk": float(score)}

# FUTURE HOTSPOTS 
@app.get("/future-hotspots")

def future_hotspots():

    res = requests.get("http://localhost:5000/api/heatmap")

    data = res.json()

    grid = []

    for lat in np.linspace(18.3,18.8,20):
        for lng in np.linspace(73.6,74.1,20):

            hour = datetime.now().hour + 2

            X = np.array([[lat,lng,hour]])

            risk = model.predict(X)[0]

            score = min(1,risk/10)

            if score > 0.6:

                grid.append({
                    "lat":float(lat),
                    "lng":float(lng),
                    "score":float(score)
                })

    return grid

# FIR NLP
texts = [
    # Stalking
    "he was following me continuously",
    "someone is tracking me daily",
    "man keeps stalking me outside my house",

    # Assault
    "he attacked me and punched me",
    "someone hit me badly",
    "physical attack happened",

    # Harassment
    "he touched me inappropriately",
    "someone harassed me verbally",
    "man misbehaved with me",

    # Theft
    "my phone got stolen",
    "someone took my wallet",
    "bike theft happened",

    # Kidnapping
    "someone tried to kidnap me",
    "child kidnapping attempt",
    "forced into a car",

    # Cybercrime
    "otp fraud happened",
    "phishing link stole my password",
    "money deducted due to scam",
    "online fraud transaction",
    "my phone got hacked",
    "my account got hacked"
]

labels = [
    "Stalking","Stalking","Stalking",
    "Assault","Assault","Assault",
    "Harassment","Harassment","Harassment",
    "Theft","Theft","Theft",
    "Kidnapping","Kidnapping","Kidnapping",
    "Cybercrime","Cybercrime","Cybercrime",
    "Cybercrime","Cybercrime","Cybercrime"
]

# 🔥 Preprocessing function
def clean_text(text):
    text = text.lower()
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    return text

cleaned_texts = [clean_text(t) for t in texts]

# 🔥 TF-IDF with n-grams
vectorizer = TfidfVectorizer(
    ngram_range=(1,2),  # captures phrases
    stop_words='english'
)

X = vectorizer.fit_transform(cleaned_texts)

# 🔥 Model
nlp_model = MultinomialNB()
nlp_model.fit(X, labels)

# 🔥 API
@app.post("/nlp")
def classify(data: dict = Body(...)):
    text = clean_text(data["text"])
    vec = vectorizer.transform([text])

    probs = nlp_model.predict_proba(vec)[0]
    confidence = max(probs)

    if confidence < 0.25:
        return {
            "type": "Unclear",
            "ipc": "Manual review required",
            "confidence": float(confidence)
        }

    crime = nlp_model.predict(vec)[0]

    ipc_map = {
        "Harassment": "IPC 354, IPC 509",
        "Stalking": "IPC 354D",
        "Assault": "IPC 351, IPC 352",
        "Theft": "IPC 379",
        "Kidnapping": "IPC 363",
        "Cybercrime": "IT Act 66, 66C, 66D"
    }

    return {
        "type": crime,
        "ipc": ipc_map.get(crime, ""),
        "confidence": float(confidence)
    }

# AI SURVEILLANCE MODEL
weapon_model = YOLO("best.pt")  

weapons = [
"knife",
"gun",
"pistol",
"rifle",
"scissors",
"baseball bat",
"hammer"
]

if not os.path.exists("evidence"):
    os.makedirs("evidence")

class Frame(BaseModel):
    image:str

# WEAPON DETECTION 
@app.post("/detect")
def detect_weapon(frame: Frame):

    try:

        img_data = frame.image.split(",")[1]
        img_bytes = base64.b64decode(img_data)

        np_arr = np.frombuffer(img_bytes,np.uint8)
        img = cv2.imdecode(np_arr,cv2.IMREAD_COLOR)

        img = cv2.resize(img,(640,640))

        results = weapon_model(img)

        detections = []

        for r in results:

            for box in r.boxes:

                cls = int(box.cls[0])
                conf = float(box.conf[0])
                label = weapon_model.names[cls]

                if conf < 0.6:
                    continue

                if label in weapons:

                    x1,y1,x2,y2 = map(int, box.xyxy[0])

                    detections.append({
                        "label":label,
                        "confidence":conf,
                        "box":[x1,y1,x2,y2]
                    })

                    # draw red box on evidence image
                    cv2.rectangle(
                        img,
                        (x1,y1),
                        (x2,y2),
                        (0,0,255),
                        3
                    )

                    cv2.putText(
                        img,
                        f"{label} {conf:.2f}",
                        (x1,y1-10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.8,
                        (0,0,255),
                        2
                    )

        # save evidence image if something detected
        if len(detections) > 0:

            filename = f"evidence/detect_{datetime.now().timestamp()}.jpg"
            cv2.imwrite(filename,img)

            for det in detections:

                requests.post(
                    "http://localhost:5000/api/ai-alert",
                    json={
                        "type":"weapon",
                        "object":det["label"],
                        "confidence":det["confidence"],
                        "camera":"Camera 1",
                        "evidence":filename
                    }
                )

        return {
            "detections":detections
        }

    except Exception as e:

        print("Detection Error:",e)

        return {"error":"AI detection failed"}