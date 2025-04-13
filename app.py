from flask import Flask, render_template, request, send_from_directory
import os
from werkzeug.utils import secure_filename
from ultralytics import YOLO
import uuid
from traffic_signs_data import TRAFFIC_SIGNS
import cv2
import numpy as np

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['RESULT_FOLDER'] = 'static/results'
app.config['CROPS_FOLDER'] = 'static/crops'

# Pastikan semua folder yang diperlukan tersedia
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['RESULT_FOLDER'], exist_ok=True)
os.makedirs(app.config['CROPS_FOLDER'], exist_ok=True)

# Load model YOLOv8
model = YOLO('rambu_yolov8_model/weights/best.pt')

# Gunakan environment variable untuk API key
WEATHER_API_KEY = os.getenv('WEATHER_API_KEY', '')

# Route untuk assets
@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory('assets', filename)

@app.route('/')
def index():
    return render_template('index.html', weather_api_key=WEATHER_API_KEY)

@app.route('/detect', methods=['GET', 'POST'])
def detect():
    detection_results = None
    if request.method == 'POST':
        if 'file' not in request.files:
            return 'No file uploaded'
        
        file = request.files['file']
        if file.filename == '':
            return 'No file selected'

        if file:
            # Generate unique filename
            unique_id = uuid.uuid4().hex
            original_filename = secure_filename(file.filename)
            filename = f"{unique_id}_{original_filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Proses deteksi menggunakan model YOLOv8
            results = model(filepath)
            result = results[0]
            
            # Simpan gambar hasil deteksi
            result_filename = f"result_{filename}"
            result_path = os.path.join(app.config['RESULT_FOLDER'], result_filename)
            result.save(result_path)
            
            # Proses setiap rambu yang terdeteksi
            detection_results = {
                'result_img': f"results/{result_filename}",
                'signs': []
            }

            # Jika tidak ada rambu terdeteksi
            if len(result.boxes) == 0:
                detection_results['no_signs'] = True
                return render_template('detect.html', detection_results=detection_results)

            # Load gambar untuk cropping
            img = cv2.imread(filepath)
            
            # Proses setiap rambu yang terdeteksi
            for i, box in enumerate(result.boxes):
                # Dapatkan koordinat box
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                
                # Crop gambar rambu
                cropped = img[y1:y2, x1:x2]
                
                # Simpan crop gambar
                crop_filename = f"crop_{i}_{filename}"
                crop_path = os.path.join(app.config['CROPS_FOLDER'], crop_filename)
                cv2.imwrite(crop_path, cropped)
                
                # Dapatkan class rambu
                sign_class = result.names[int(box.cls[0])]
                confidence = float(box.conf[0])
                
                # Dapatkan informasi rambu
                sign_info = TRAFFIC_SIGNS.get(sign_class, {
                    'name': sign_class,
                    'description': 'Informasi tidak tersedia',
                    'law': 'Informasi tidak tersedia'
                })
                
                # Tambahkan ke hasil deteksi
                detection_results['signs'].append({
                    'class': sign_class,
                    'name': sign_info['name'],
                    'description': sign_info['description'],
                    'law': sign_info['law'],
                    'confidence': confidence,
                    'crop_img': f"crops/{crop_filename}"
                })

    return render_template('detect.html', detection_results=detection_results)

@app.route('/', methods=['GET', 'POST'])
def index_post():
    result_img = None

    if request.method == 'POST':
        file = request.files['file']
        if file:
            filename = secure_filename(file.filename)
            input_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(input_path)

            # Generate nama unik untuk hasil output
            unique_filename = f"result_{uuid.uuid4().hex}.jpg"
            output_path = os.path.join(app.config['RESULT_FOLDER'], unique_filename)

            # Deteksi gambar dan simpan hasil ke output_path
            results = model(input_path)
            results[0].save(filename=output_path)

            result_img = f'results/{unique_filename}'

    return render_template('index.html', result_img=result_img)

if __name__ == '__main__':
    app.run(debug=True)
