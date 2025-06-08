document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
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
    const errorContainer = document.getElementById('errorContainer');
    const filePreview = document.getElementById('filePreview');
    const selectedFileName = document.getElementById('selectedFileName');
    const removeFileButton = document.getElementById('removeFile');
    const analyzeFileButton = document.getElementById('analyzeFile');

    // Constants
    const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB
    const ALLOWED_TYPES = ['.pdf', '.doc', '.docx', '.txt'];

    // Current file storage
    let currentFile = null;

    // Toggle between file upload and text input
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const mode = button.dataset.mode;
            
            // Update active button
            toggleButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            button.classList.add('active');
            button.setAttribute('aria-selected', 'true');
            
            // Show/hide sections
            if (mode === 'file') {
                fileUploadSection.style.display = 'block';
                textInputSection.style.display = 'none';
                fileUploadSection.setAttribute('aria-hidden', 'false');
                textInputSection.setAttribute('aria-hidden', 'true');
            } else {
                fileUploadSection.style.display = 'none';
                textInputSection.style.display = 'block';
                fileUploadSection.setAttribute('aria-hidden', 'true');
                textInputSection.setAttribute('aria-hidden', 'false');
            }
            
            // Hide results and clear file preview when switching modes
            hideResults();
            clearFilePreview();
        });
    });

    // Show error message
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorContainer.innerHTML = '';
        errorContainer.appendChild(errorDiv);
        
        // Announce error to screen readers
        errorDiv.setAttribute('role', 'alert');
        errorDiv.setAttribute('aria-live', 'assertive');
        
        // Remove error after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // Hide results section
    function hideResults() {
        resultsSection.style.display = 'none';
        doctorConsultation.style.display = 'none';
        resultsSection.setAttribute('aria-hidden', 'true');
    }

    // Show loading state
    function showLoading() {
        loading.style.display = 'block';
        hideResults();
    }

    // Hide loading state
    function hideLoading() {
        loading.style.display = 'none';
    }

    // Validate file
    function validateFile(file) {
        if (file.size > MAX_FILE_SIZE) {
            throw new Error('File size exceeds 16MB limit');
        }

        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_TYPES.includes(fileExtension)) {
            throw new Error('Please upload a valid file type (PDF, DOC, DOCX, or TXT)');
        }

        return true;
    }

    // Show file preview
    function showFilePreview(file) {
        currentFile = file;
        selectedFileName.textContent = file.name;
        filePreview.style.display = 'block';
        dropZone.style.display = 'none';
    }

    // Clear file preview
    function clearFilePreview() {
        currentFile = null;
        filePreview.style.display = 'none';
        dropZone.style.display = 'block';
        fileInput.value = '';
    }

    // Remove file button handler
    removeFileButton.addEventListener('click', () => {
        clearFilePreview();
    });

    // Analyze file button handler
    analyzeFileButton.addEventListener('click', () => {
        if (currentFile) {
            handleFile(currentFile);
        }
    });

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
            try {
                validateFile(files[0]);
                showFilePreview(files[0]);
            } catch (error) {
                showError(error.message);
            }
        }
    });

    // Keyboard accessibility for drop zone
    dropZone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
        }
    });

    // Click to upload
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            try {
                validateFile(e.target.files[0]);
                showFilePreview(e.target.files[0]);
            } catch (error) {
                showError(error.message);
            }
        }
    });

    // Handle text analysis
    analyzeTextButton.addEventListener('click', () => {
        const text = medicalText.value.trim();
        if (!text) {
            showError('Please enter your medical report or describe your condition');
            medicalText.focus();
            return;
        }
        analyzeText(text);
    });

    // Handle Enter key in textarea
    medicalText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            analyzeTextButton.click();
        }
    });

    function handleFile(file) {
        try {
            validateFile(file);
            showLoading();

            const formData = new FormData();
            formData.append('file', file);

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
                hideLoading();
            });
        } catch (error) {
            showError(error.message);
        }
    }

    function analyzeText(text) {
        showLoading();

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
            hideLoading();
        });
    }

    function displayResults(data) {
        try {
            // Display severity
            const severityBadge = document.getElementById('severityBadge');
            const severityText = data.severity.charAt(0).toUpperCase() + data.severity.slice(1);
            severityBadge.textContent = severityText;
            severityBadge.className = 'severity-badge ' + data.severity;
            severityBadge.setAttribute('aria-label', `Severity level: ${severityText}`);

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
            resultsSection.setAttribute('aria-hidden', 'false');

            // Scroll to results
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error displaying results:', error);
            showError('Error displaying results. Please try again.');
        }
    }
}); 