document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const loading = document.getElementById('loading');
    const resultsSection = document.getElementById('resultsSection');
    const doctorConsultation = document.getElementById('doctorConsultation');

    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
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

    function handleFile(file) {
        // Check file type
        const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            alert('Please upload a valid file type (PDF, DOC, DOCX, or TXT)');
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
        .then(response => response.json())
        .then(data => {
            displayResults(data);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while analyzing the file. Please try again.');
        })
        .finally(() => {
            loading.style.display = 'none';
        });
    }

    function displayResults(data) {
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
    }
}); 