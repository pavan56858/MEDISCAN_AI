# Medical Report Analyzer

A web application that analyzes medical reports and provides recommendations for medicines, diet plans, and doctor consultations.

## Features

- Upload medical reports in PDF, DOC, DOCX, or TXT format
- Automatic text extraction and analysis
- Severity assessment of medical conditions
- Symptom and condition detection
- Medicine recommendations
- Diet plan suggestions
- Doctor consultation recommendations when necessary

## Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd medical-report-analyzer
```

2. Install the required packages:
```bash
pip install -r requirements.txt
```

## Usage

1. Start the Flask application:
```bash
python app.py
```

2. Open your web browser and navigate to:
```
http://localhost:5000
```

3. Upload a medical report file (PDF, DOC, DOCX, or TXT)

4. View the analysis results, including:
   - Severity level
   - Detected symptoms
   - Identified conditions
   - Recommended medicines
   - Suggested diet plan
   - Doctor consultation recommendations

## Project Structure

```
medical-report-analyzer/
├── app.py              # Flask application
├── requirements.txt    # Python dependencies
├── static/            # Static files
│   ├── style.css      # CSS styles
│   ├── script.js      # JavaScript code
│   └── upload-icon.svg # Upload icon
├── templates/         # HTML templates
│   └── index.html     # Main page template
└── uploads/          # Temporary upload directory
```

## Note

This application is for educational purposes only and should not be used as a substitute for professional medical advice. Always consult with healthcare professionals for medical decisions.

## License

MIT License 