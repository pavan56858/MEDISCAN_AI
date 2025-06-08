from flask import Flask, render_template, request, jsonify
import os
from werkzeug.utils import secure_filename
import PyPDF2
import docx
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import json
from typing import Dict, List, Any
import logging
from werkzeug.exceptions import HTTPException
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
app.config['UPLOAD_FOLDER'] = '/tmp/uploads'  # Use /tmp for Vercel
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', os.urandom(24))

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
except Exception as e:
    logger.error(f"Failed to download NLTK data: {str(e)}")

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt'}

# Error handlers
@app.errorhandler(HTTPException)
def handle_http_error(error):
    response = {
        "error": error.description,
        "status_code": error.code
    }
    return jsonify(response), error.code

@app.errorhandler(Exception)
def handle_generic_error(error):
    logger.error(f"Unhandled error: {str(error)}")
    response = {
        "error": "An unexpected error occurred",
        "status_code": 500
    }
    return jsonify(response), 500

def allowed_file(filename: str) -> bool:
    """Check if the file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file."""
    try:
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text()
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        raise

def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX file."""
    try:
        doc = docx.Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        logger.error(f"Error extracting text from DOCX: {str(e)}")
        raise

def analyze_medical_report(text: str) -> Dict[str, Any]:
    """Analyze medical report text and return analysis results."""
    try:
        # Medical keywords database (expand this with a proper medical knowledge base)
        medical_keywords = {
            "severe": ["severe", "critical", "acute", "serious", "emergency"],
            "moderate": ["moderate", "mild", "stable", "manageable"],
            "symptoms": ["fever", "cough", "pain", "fatigue", "headache", "nausea", "dizziness"],
            "conditions": ["diabetes", "hypertension", "asthma", "arthritis", "infection"]
        }
        
        tokens = word_tokenize(text.lower())
        stop_words = set(stopwords.words('english'))
        filtered_tokens = [word for word in tokens if word not in stop_words]
        
        # Initialize analysis results
        severity = "low"
        symptoms = []
        conditions = []
        
        # Analyze text
        for word in filtered_tokens:
            if word in medical_keywords["severe"]:
                severity = "high"
            elif word in medical_keywords["moderate"] and severity != "high":
                severity = "moderate"
            if word in medical_keywords["symptoms"]:
                symptoms.append(word)
            if word in medical_keywords["conditions"]:
                conditions.append(word)
        
        # Generate recommendations
        recommendations = generate_recommendations(severity, symptoms, conditions)
        
        return {
            "severity": severity,
            "symptoms": list(set(symptoms)),  # Remove duplicates
            "conditions": list(set(conditions)),  # Remove duplicates
            "recommendations": recommendations
        }
    except Exception as e:
        logger.error(f"Error analyzing medical report: {str(e)}")
        raise

def generate_recommendations(severity: str, symptoms: List[str], conditions: List[str]) -> Dict[str, Any]:
    """Generate recommendations based on analysis results."""
    recommendations = {
        "medicines": [],
        "diet_plan": [],
        "doctor_consultation": False
    }
    
    if severity == "high":
        recommendations["doctor_consultation"] = True
        recommendations["medicines"] = ["Consult doctor for prescription"]
        recommendations["diet_plan"] = ["Follow doctor's dietary recommendations"]
    elif severity == "moderate":
        recommendations["medicines"] = ["Over-the-counter pain relievers", "Rest"]
        recommendations["diet_plan"] = ["Light meals", "Plenty of fluids", "Avoid spicy foods"]
    else:
        recommendations["medicines"] = ["Rest", "Hydration"]
        recommendations["diet_plan"] = ["Regular balanced diet", "Stay hydrated"]
    
    return recommendations

@app.route('/')
def home():
    """Render the home page."""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload and analysis."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        try:
            file.save(file_path)
            
            # Extract text based on file type
            if filename.endswith('.pdf'):
                text = extract_text_from_pdf(file_path)
            elif filename.endswith(('.doc', '.docx')):
                text = extract_text_from_docx(file_path)
            else:  # txt file
                with open(file_path, 'r', encoding='utf-8') as f:
                    text = f.read()
            
            # Analyze the text
            analysis_result = analyze_medical_report(text)
            
            return jsonify(analysis_result)
            
        finally:
            # Clean up uploaded file
            if os.path.exists(file_path):
                os.remove(file_path)
                
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        return jsonify({'error': 'An error occurred while processing the file'}), 500

@app.route('/analyze-text', methods=['POST'])
def analyze_text():
    """Handle text input analysis."""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        text = data['text']
        if not text.strip():
            return jsonify({'error': 'Empty text provided'}), 400
        
        # Analyze the text
        analysis_result = analyze_medical_report(text)
        return jsonify(analysis_result)
        
    except Exception as e:
        logger.error(f"Error analyzing text: {str(e)}")
        return jsonify({'error': 'An error occurred while analyzing the text'}), 500

# Vercel requires this
if __name__ == '__main__':
    app.run(debug=False) 