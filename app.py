from flask import Flask, render_template, request
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

@app.route('/', methods=['GET', 'POST'])
def index():
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
