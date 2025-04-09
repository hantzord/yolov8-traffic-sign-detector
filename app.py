from flask import Flask, render_template, request, send_from_directory
import os
from werkzeug.utils import secure_filename
from ultralytics import YOLO
import uuid

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['RESULT_FOLDER'] = 'static/results'

# Pastikan folder upload dan results tersedia
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['RESULT_FOLDER'], exist_ok=True)

# Load model YOLOv8
model = YOLO('rambu_yolov8_model/weights/best.pt')

# Route untuk assets
@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory('assets', filename)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/detect', methods=['GET', 'POST'])
def detect():
    result_img = None
    if request.method == 'POST':
        if 'file' not in request.files:
            return 'No file uploaded'
        
        file = request.files['file']
        if file.filename == '':
            return 'No file selected'

        if file:
            # Simpan file yang diupload
            filename = file.filename
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Proses deteksi menggunakan model YOLOv8
            results = model(filepath)
            
            # Simpan hasil deteksi
            result_filename = f"result_{filename}"
            result_path = os.path.join(app.config['RESULT_FOLDER'], result_filename)
            results[0].save(result_path)
            
            result_img = f"results/{result_filename}"

    return render_template('detect.html', result_img=result_img)

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
