document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const loading = document.getElementById('loading');
    const resultsSection = document.getElementById('resultsSection');
    const doctorConsultation = document.getElementById('doctorConsultation');
    const fileUploadSection = document.getElementById('fileUploadSection');
    const textInputSection = document.getElementById('textInputSection');
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    const analyzeTextButton = document.getElementById('analyzeText');
    const medicalText = document.getElementById('medicalText');

    // Toggle between file upload and text input
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const mode = button.dataset.mode;
            
            // Update active button
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show/hide sections
            if (mode === 'file') {
                fileUploadSection.style.display = 'block';
                textInputSection.style.display = 'none';
            } else {
                fileUploadSection.style.display = 'none';
                textInputSection.style.display = 'block';
            }
            
            // Hide results when switching modes
            resultsSection.style.display = 'none';
            doctorConsultation.style.display = 'none';
        });
    });

    // Show error message
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.querySelector('.container').insertBefore(errorDiv, resultsSection);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Click to upload
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // Handle text analysis
    analyzeTextButton.addEventListener('click', () => {
        const text = medicalText.value.trim();
        if (!text) {
            showError('Please enter your medical report or describe your condition');
            return;
        }
        analyzeText(text);
    });

    function handleFile(file) {
        // Check file size (16MB limit)
        const maxSize = 16 * 1024 * 1024; // 16MB in bytes
        if (file.size > maxSize) {
            showError('File size exceeds 16MB limit');
            return;
        }

        // Check file type
        const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            showError('Please upload a valid file type (PDF, DOC, DOCX, or TXT)');
            return;
        }

        // Show loading
        loading.style.display = 'block';
        resultsSection.style.display = 'none';
        doctorConsultation.style.display = 'none';

        // Create form data
        const formData = new FormData();
        formData.append('file', file);

        // Upload file
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'An error occurred');
                });
            }
            return response.json();
        })
        .then(data => {
            displayResults(data);
        })
        .catch(error => {
            console.error('Error:', error);
            showError(error.message || 'An error occurred while analyzing the file. Please try again.');
        })
        .finally(() => {
            loading.style.display = 'none';
        });
    }

    function analyzeText(text) {
        // Show loading
        loading.style.display = 'block';
        resultsSection.style.display = 'none';
        doctorConsultation.style.display = 'none';

        // Send text for analysis
        fetch('/analyze-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'An error occurred');
                });
            }
            return response.json();
        })
        .then(data => {
            displayResults(data);
        })
        .catch(error => {
            console.error('Error:', error);
            showError(error.message || 'An error occurred while analyzing the text. Please try again.');
        })
        .finally(() => {
            loading.style.display = 'none';
        });
    }

    function displayResults(data) {
        try {
            // Display severity
            const severityBadge = document.getElementById('severityBadge');
            severityBadge.textContent = data.severity.charAt(0).toUpperCase() + data.severity.slice(1);
            severityBadge.className = 'severity-badge ' + data.severity;

            // Display symptoms
            const symptomsList = document.getElementById('symptomsList');
            symptomsList.innerHTML = data.symptoms.length > 0 
                ? data.symptoms.map(symptom => `<li>${symptom}</li>`).join('')
                : '<li>No symptoms detected</li>';

            // Display conditions
            const conditionsList = document.getElementById('conditionsList');
            conditionsList.innerHTML = data.conditions.length > 0
                ? data.conditions.map(condition => `<li>${condition}</li>`).join('')
                : '<li>No conditions identified</li>';

            // Display medicines
            const medicinesList = document.getElementById('medicinesList');
            medicinesList.innerHTML = data.recommendations.medicines
                .map(medicine => `<li>${medicine}</li>`).join('');

            // Display diet plan
            const dietList = document.getElementById('dietList');
            dietList.innerHTML = data.recommendations.diet_plan
                .map(diet => `<li>${diet}</li>`).join('');

            // Show/hide doctor consultation warning
            doctorConsultation.style.display = data.recommendations.doctor_consultation ? 'block' : 'none';

            // Show results
            resultsSection.style.display = 'block';

            // Scroll to results
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error displaying results:', error);
            showError('Error displaying results. Please try again.');
        }
    }
}); 