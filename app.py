from flask import Flask, render_template, request, jsonify
import os
from werkzeug.utils import secure_filename
import PyPDF2
import docx
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import json

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Download required NLTK data
nltk.download('punkt')
nltk.download('stopwords')

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file_path):
    text = ""
    with open(file_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        for page in pdf_reader.pages:
            text += page.extract_text()
    return text

def extract_text_from_docx(file_path):
    doc = docx.Document(file_path)
    text = ""
    for paragraph in doc.paragraphs:
        text += paragraph.text + "\n"
    return text

def analyze_medical_report(text):
    # This is a simplified analysis. In a real application, you would use more sophisticated NLP
    # and medical knowledge base
    symptoms = []
    conditions = []
    severity = "low"
    
    # Simple keyword matching (expand this with a proper medical knowledge base)
    medical_keywords = {
        "severe": ["severe", "critical", "acute", "serious"],
        "moderate": ["moderate", "mild", "stable"],
        "symptoms": ["fever", "cough", "pain", "fatigue", "headache"],
        "conditions": ["diabetes", "hypertension", "asthma", "arthritis"]
    }
    
    tokens = word_tokenize(text.lower())
    stop_words = set(stopwords.words('english'))
    filtered_tokens = [word for word in tokens if word not in stop_words]
    
    # Analyze severity
    for word in filtered_tokens:
        if word in medical_keywords["severe"]:
            severity = "high"
        elif word in medical_keywords["moderate"]:
            severity = "moderate"
        if word in medical_keywords["symptoms"]:
            symptoms.append(word)
        if word in medical_keywords["conditions"]:
            conditions.append(word)
    
    # Generate recommendations based on analysis
    recommendations = {
        "medicines": [],
        "diet_plan": [],
        "doctor_consultation": False
    }
    
    if severity == "high":
        recommendations["doctor_consultation"] = True
        recommendations["medicines"] = ["Consult doctor for prescription"]
    elif severity == "moderate":
        recommendations["medicines"] = ["Over-the-counter pain relievers", "Rest"]
        recommendations["diet_plan"] = ["Light meals", "Plenty of fluids"]
    else:
        recommendations["medicines"] = ["Rest", "Hydration"]
        recommendations["diet_plan"] = ["Regular balanced diet", "Stay hydrated"]
    
    return {
        "severity": severity,
        "symptoms": symptoms,
        "conditions": conditions,
        "recommendations": recommendations
    }

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Extract text based on file type
        if filename.endswith('.pdf'):
            text = extract_text_from_pdf(file_path)
        elif filename.endswith(('.doc', '.docx')):
            text = extract_text_from_docx(file_path)
        else:  # txt file
            with open(file_path, 'r') as f:
                text = f.read()
        
        # Analyze the text
        analysis_result = analyze_medical_report(text)
        
        # Clean up
        os.remove(file_path)
        
        return jsonify(analysis_result)
    
    return jsonify({'error': 'Invalid file type'}), 400

if __name__ == '__main__':
    app.run(debug=True) 