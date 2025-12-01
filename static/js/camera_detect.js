// Camera detection functionality
let stream = null;
let video = null;
let detectionRunning = false;
let detectionInterval = 500; // milliseconds
let detectionTimer = null;
let processingFrame = false;
let currentConfThreshold = 0.25; // Default, will be updated from HTML

// Camera control buttons
let startCameraBtn;
let stopCameraBtn;
let toggleDetectionBtn;
let takeSnapshotBtn;
let processingIndicator;

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI elements
    video = document.getElementById('camera-feed');
    startCameraBtn = document.getElementById('start-camera');
    stopCameraBtn = document.getElementById('stop-camera');
    toggleDetectionBtn = document.getElementById('toggle-detection');
    takeSnapshotBtn = document.getElementById('take-snapshot');
    processingIndicator = document.getElementById('processing-indicator');
    
    // Get the confidence threshold from the page
    const confThresholdElement = document.getElementById('conf_threshold');
    if (confThresholdElement) {
        currentConfThreshold = parseFloat(confThresholdElement.value);
        
        // Update slider UI
        updateSlider(confThresholdElement);
        
        // Add event listener for confidence threshold changes
        confThresholdElement.addEventListener('input', function() {
            currentConfThreshold = parseFloat(this.value);
            updateSlider(this);
        });
    }
    
    // Initialize detection interval slider
    const intervalSlider = document.getElementById('detection_interval');
    if (intervalSlider) {
        updateIntervalSlider(intervalSlider);
        
        // Add event listener for interval changes
        intervalSlider.addEventListener('input', function() {
            updateIntervalSlider(this);
        });
    }
    
    // Setup camera control buttons
    if (startCameraBtn) startCameraBtn.addEventListener('click', startCamera);
    if (stopCameraBtn) stopCameraBtn.addEventListener('click', stopCamera);
    if (toggleDetectionBtn) toggleDetectionBtn.addEventListener('click', toggleDetection);
    if (takeSnapshotBtn) takeSnapshotBtn.addEventListener('click', takeSnapshot);
});

// Function to update slider value
function updateSlider(slider) {
    const value = slider.value;
    const confValue = document.getElementById('conf_value');
    
    // Add animation on value change
    confValue.classList.add('scale-animation');
    setTimeout(() => {
        confValue.classList.remove('scale-animation');
    }, 200);
    
    confValue.textContent = value;
    
    // Calculate percentage for gradient background
    const percent = ((value - slider.min) / (slider.max - slider.min)) * 100;
    
    // Update slider background color based on value
    slider.style.background = `linear-gradient(to right, #007bff 0%, #007bff ${percent}%, #e9ecef ${percent}%, #e9ecef 100%)`;
    
    // Change badge color based on confidence value
    if (value < 0.25) {
        confValue.style.background = '#28a745'; // green for low values (more sensitive)
        confValue.innerHTML = `<i class="fas fa-check-double me-1"></i>${value}`;
    } else if (value < 0.5) {
        confValue.style.background = '#007bff'; // blue for medium values
        confValue.innerHTML = `<i class="fas fa-check me-1"></i>${value}`;
    } else {
        confValue.style.background = '#dc3545'; // red for high values (less sensitive)
        confValue.innerHTML = `<i class="fas fa-filter me-1"></i>${value}`;
    }
}

// Update interval slider
function updateIntervalSlider(slider) {
    const value = slider.value;
    const intervalBadge = document.getElementById('interval_value');
    
    intervalBadge.textContent = `${value}ms`;
    detectionInterval = parseInt(value);
    
    // Update slider color gradient
    const percent = ((value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = `linear-gradient(to right, #007bff 0%, #007bff ${100-percent}%, #e9ecef ${100-percent}%, #e9ecef 100%)`;
    
    // Change badge color based on value
    if (value < 500) {
        intervalBadge.style.background = '#28a745'; // Green for fast
    } else if (value < 1000) {
        intervalBadge.style.background = '#007bff'; // Blue for medium
    } else {
        intervalBadge.style.background = '#dc3545'; // Red for slow
    }
}

// Start camera stream
async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "environment" // Try to use the back camera if available
            },
            audio: false 
        });
        
        video.srcObject = stream;
        startCameraBtn.disabled = true;
        stopCameraBtn.disabled = false;
        toggleDetectionBtn.disabled = false;
        takeSnapshotBtn.disabled = false;
        
        // Update UI message
        document.getElementById('detection-results').innerHTML = `
            <div class="no-detection">
                <i class="fas fa-check-circle fa-3x mb-3" style="color: #28a745;"></i>
                <p>Camera is active. Click "Start Detection" to begin.</p>
            </div>
        `;
    } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Error accessing camera: " + err.message);
    }
}

// Stop camera stream
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        stream = null;
    }
    
    // Also stop detection if running
    if (detectionRunning) {
        stopDetection();
    }
    
    startCameraBtn.disabled = false;
    stopCameraBtn.disabled = true;
    toggleDetectionBtn.disabled = true;
    takeSnapshotBtn.disabled = true;
    
    // Reset UI
    document.getElementById('detection-results').innerHTML = `
        <div class="no-detection">
            <i class="fas fa-camera-retro fa-3x mb-3"></i>
            <p>Start the camera and detection to see results</p>
        </div>
    `;
    document.getElementById('detection-overlay').innerHTML = '';
}

// Toggle detection on/off
function toggleDetection() {
    if (detectionRunning) {
        stopDetection();
    } else {
        startDetection();
    }
}

// Start detection loop
function startDetection() {
    detectionRunning = true;
    toggleDetectionBtn.innerHTML = '<i class="fas fa-pause me-2"></i>Pause Detection';
    toggleDetectionBtn.classList.remove('btn-success');
    toggleDetectionBtn.classList.add('btn-warning');
    
    // Update UI message
    document.getElementById('detection-results').innerHTML = `
        <div class="no-detection">
            <i class="fas fa-spinner fa-spin fa-3x mb-3"></i>
            <p>Detection is running...</p>
        </div>
    `;
    
    // Start detection loop
    detectFrame();
}

// Stop detection loop
function stopDetection() {
    detectionRunning = false;
    
    if (detectionTimer) {
        clearTimeout(detectionTimer);
        detectionTimer = null;
    }
    
    toggleDetectionBtn.innerHTML = '<i class="fas fa-play me-2"></i>Start Detection';
    toggleDetectionBtn.classList.remove('btn-warning');
    toggleDetectionBtn.classList.add('btn-success');
    
    // Hide processing indicator
    processingIndicator.classList.remove('active');
    
    // Update UI message
    document.getElementById('detection-results').innerHTML = `
        <div class="no-detection">
            <i class="fas fa-pause-circle fa-3x mb-3" style="color: #ffc107;"></i>
            <p>Detection is paused. Click "Start Detection" to resume.</p>
        </div>
    `;
}

// Detect frame from video
async function detectFrame() {
    if (!detectionRunning || !stream || processingFrame) {
        return;
    }
    
    processingFrame = true;
    processingIndicator.classList.add('active');
    
    try {
        // Create a canvas to capture the current video frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
            // Create form data to send to server
            const formData = new FormData();
            formData.append('frame', blob, 'frame.jpg');
            formData.append('conf_threshold', currentConfThreshold);
            
            // Send frame to server for detection
            const response = await fetch('/process-frame', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Update UI with detection results
                updateDetectionResults(result.signs, canvas.width, canvas.height);
            } else {
                console.error("Error in detection:", result.error);
            }
            
            // Reset processing flag
            processingFrame = false;
            processingIndicator.classList.remove('active');
            
            // Schedule next detection if still running
            if (detectionRunning) {
                detectionTimer = setTimeout(detectFrame, detectionInterval);
            }
        }, 'image/jpeg', 0.9);
    } catch (err) {
        console.error("Error in detection process:", err);
        processingFrame = false;
        processingIndicator.classList.remove('active');
        
        // Continue detection despite error
        if (detectionRunning) {
            detectionTimer = setTimeout(detectFrame, detectionInterval);
        }
    }
}

// Update detection results in UI
function updateDetectionResults(signs, frameWidth, frameHeight) {
    // Clear previous detections
    const overlay = document.getElementById('detection-overlay');
    overlay.innerHTML = '';
    
    // Get the current scale of the video display
    const videoElement = document.getElementById('camera-feed');
    const displayWidth = videoElement.clientWidth;
    const displayHeight = videoElement.clientHeight;
    
    const scaleX = displayWidth / frameWidth;
    const scaleY = displayHeight / frameHeight;
    
    // Create bounding boxes for detected signs
    if (signs && signs.length > 0) {
        // Update detection results panel
        const resultsContainer = document.getElementById('detection-results');
        let resultsHTML = `<h6 class="mb-3">Detected: ${signs.length} sign(s)</h6>`;
        
        signs.forEach((sign, index) => {
            // Draw bounding box on the overlay
            const [x1, y1, x2, y2] = sign.box;
            
            // Scale coordinates to match display size
            const scaledX1 = x1 * scaleX;
            const scaledY1 = y1 * scaleY;
            const scaledWidth = (x2 - x1) * scaleX;
            const scaledHeight = (y2 - y1) * scaleY;
            
            const boxElement = document.createElement('div');
            boxElement.className = 'bounding-box';
            boxElement.style.left = `${scaledX1}px`;
            boxElement.style.top = `${scaledY1}px`;
            boxElement.style.width = `${scaledWidth}px`;
            boxElement.style.height = `${scaledHeight}px`;
            
            // Add name tag
            const tagElement = document.createElement('div');
            tagElement.className = 'sign-tag';
            tagElement.innerText = `${sign.name} (${(sign.confidence * 100).toFixed(0)}%)`;
            
            boxElement.appendChild(tagElement);
            overlay.appendChild(boxElement);
            
            // Add to results panel
            resultsHTML += `
                <div class="detected-sign">
                    <h6>${sign.name}</h6>
                    <div class="d-flex justify-content-between">
                        <span class="badge bg-success">
                            <i class="fas fa-check-circle me-1"></i>
                            Confidence: ${(sign.confidence * 100).toFixed(0)}%
                        </span>
                    </div>
                    <hr>
                    <small class="text-muted">${sign.description}</small>
                </div>
            `;
        });
        
        resultsContainer.innerHTML = resultsHTML;
    } else {
        // No signs detected
        document.getElementById('detection-results').innerHTML = `
            <div class="no-detection">
                <i class="fas fa-search fa-3x mb-3"></i>
                <p>No traffic signs detected in current view</p>
            </div>
        `;
    }
}

// Take and save a snapshot
function takeSnapshot() {
    if (!stream) return;
    
    // Create a canvas to capture the current video frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to data URL
    const dataURL = canvas.toDataURL('image/jpeg');
    
    // Create a temporary download link
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `traffic-sign-snapshot-${new Date().getTime()}.jpg`;
    link.click();
} 