# 🚦 YOLOv8 Traffic Sign Detector

Aplikasi web berbasis AI untuk deteksi rambu lalu lintas Indonesia secara real-time menggunakan model YOLOv8 yang telah dilatih khusus.

## 📋 Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Instalasi](#instalasi)
- [Penggunaan](#penggunaan)
- [API Endpoints](#api-endpoints)
- [Struktur Project](#struktur-project)
- [Rambu yang Terdeteksi](#rambu-yang-terdeteksi)
- [Lisensi](#lisensi)

## 🎯 Fitur Utama

✨ **Deteksi Rambu Real-time**
- Deteksi rambu lalu lintas dari upload gambar atau webcam
- Confidence threshold yang dapat disesuaikan
- Visualisasi hasil deteksi dengan bounding boxes

📸 **Multiple Input Methods**
- Upload gambar dari device
- Deteksi melalui live camera/webcam
- Support berbagai format gambar (JPG, PNG, dll)

📊 **Informasi Detail Rambu**
- Nama dan deskripsi setiap rambu
- Referensi hukum (UU No. 22 Tahun 2009)
- Cropping gambar untuk setiap rambu terdeteksi

🌦️ **Integrasi Weather API**
- Menampilkan informasi cuaca real-time
- Relevan untuk konteks keselamatan berkendara

⚡ **Performance**
- Model YOLOv8 yang dioptimalkan
- Deteksi cepat dan akurat
- Threshold confidence yang dapat dikustomisasi

## 🛠️ Teknologi yang Digunakan

### Backend
- **Framework**: Flask 2.3.3
- **AI/ML**: Ultralytics YOLOv8 8.0.196
- **Computer Vision**: OpenCV (opencv-python-headless 4.8.1.78)
- **Server**: Gunicorn 21.2.0

### Frontend
- **HTML5** dengan Template Jinja2
- **CSS3** untuk styling
- **JavaScript** untuk interaksi

### Dependencies
- NumPy >= 1.22.2
- Werkzeug 2.3.7 (File handling)

## 💻 Persyaratan Sistem

### Minimum Requirements
- Python 3.8 atau lebih tinggi
- RAM: 4GB
- Disk Space: 2GB (untuk model dan dependencies)
- Internet connection (untuk weather API)

### Recommended
- Python 3.9+
- RAM: 8GB
- GPU support (untuk deteksi lebih cepat)
- Webcam USB untuk live detection

## 🚀 Instalasi

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/yolov8-traffic-sign-detector.git
cd yolov8-traffic-sign-detector
```

### 2. Setup Virtual Environment (Recommended)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```
### 4. Verifikasi Model
Pastikan folder `rambu_yolov8_model/weights/` berisi file `best.pt` (model yang sudah terlatih)

## 📖 Penggunaan

### Menjalankan Aplikasi

#### Development Mode
```bash
python app.py
```

#### Production Mode (dengan Gunicorn)
```bash
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

Buka browser dan akses: `http://localhost:5000`

### Menggunakan Aplikasi

1. **Halaman Utama** (`/`)
   - Navigasi ke halaman utama
   - Lihat informasi cuaca real-time

2. **Deteksi dari Gambar** (`/detect`)
   - Pilih gambar dari device
   - Atur confidence threshold (0.0 - 1.0)
   - Klik "Detect"
   - Lihat hasil deteksi dengan informasi rambu

3. **Deteksi dari Webcam** (`/camera_detect`)
   - Buka page deteksi camera
   - Izinkan akses webcam
   - Lakukan deteksi real-time
   - Simpan screenshot hasil deteksi

## 🔌 API Endpoints

### GET Endpoints

| Endpoint | Deskripsi |
|----------|-----------|
| `/` | Halaman utama aplikasi |
| `/detect` | Halaman deteksi dari gambar |
| `/camera_detect` | Halaman deteksi dari webcam |
| `/assets/<path>` | Static assets (CSS, JS, images) |

### POST Endpoints

| Endpoint | Deskripsi | Parameter |
|----------|-----------|-----------|
| `/detect` | Proses deteksi gambar | `file`, `conf_threshold` |

## 📁 Struktur Project

```
yolov8-traffic-sign-detector/
├── app.py                          # Aplikasi Flask utama
├── traffic_signs_data.py           # Database rambu lalu lintas
├── requirements.txt                # Python dependencies
├── README.md                       # Dokumentasi
│
├── rambu_yolov8_model/
│   ├── weights/
│   │   ├── best.pt                # Model YOLOv8 (terlatih)
│   │   └── last.pt                # Model checkpoint terakhir
│   ├── results.csv                # Hasil training
│   └── events.out.tfevents.*      # TensorBoard logs
│
├── static/
│   ├── uploads/                   # Folder temporary upload
│   ├── results/                   # Hasil deteksi gambar
│   ├── crops/                     # Cropped region dari deteksi
│   ├── originals/                 # Gambar original permanen
│   ├── css/
│   │   ├── style.css             # Styling global
│   │   └── detect.css            # Styling halaman deteksi
│   └── js/
│       ├── detect.js             # Logic deteksi gambar
│       └── camera_detect.js      # Logic deteksi webcam
│
├── templates/
│   ├── index.html                # Halaman utama
│   ├── detect.html               # Halaman deteksi gambar
│   └── camera_detect.html        # Halaman deteksi webcam
│
└── assets/
    └── images/                   # Asset gambar (logo, etc)
```

## 🚦 Rambu yang Terdeteksi

Aplikasi dapat mendeteksi **23+ rambu lalu lintas Indonesia** termasuk:

### Rambu Larangan
- 🚫 Dilarang Masuk (Do Not Enter)
- 🛑 Dilarang Berhenti (Do Not Stop)
- ⬅️ Dilarang Belok Kiri (Do Not Turn Left)
- ➡️ Dilarang Belok Kanan (Do Not Turn Right)
- 🔄 Dilarang Putar Balik (Do Not U-Turn)
- 🅿️ Dilarang Parkir (No Parking)

### Rambu Perintah
- ➡️ Masuk Jalur Kiri (Enter Left Lane)
- 🔄 Putar Balik (U-Turn)
- 🛑 Berhenti (Stop)

### Rambu Petunjuk
- 🏥 Halte Bus (Bus Stop)
- 🅿️ Area Parkir (Parking)
- 🚶 Penyeberangan Pejalan Kaki (Pedestrian Crossing)
- 🟰 Zebra Cross (Zebra Crossing)
- 🔀 Jalur Kiri dan Kanan (Left Right Lane)

### Rambu Peringatan
- ⚠️ Peringatan Umum (Warning)
- 🚂 Perlintasan Kereta Api (Railway Crossing)
- 🚦 Lampu Lalu Lintas (Traffic Light)
- 📍 Persimpangan T (T Intersection)

### Sinyal Lalu Lintas
- 🟢 Lampu Hijau (Green Light)
- 🔴 Lampu Merah (Red Light)

Setiap rambu dilengkapi dengan:
- Nama resmi
- Deskripsi detail
- Referensi undang-undang terkait

## 📊 Model YOLOv8

Model yang digunakan telah dilatih dengan dataset khusus rambu lalu lintas Indonesia dengan:
- **Accuracy**: ~95%
- **Inference Speed**: ~30-50ms per gambar (CPU)
- **Architecture**: YOLOv8 (Ultralytics)

## 🙏 Acknowledgements

- [Ultralytics YOLO](https://github.com/ultralytics/ultralytics) - Framework deteksi objek
- [Flask](https://flask.palletsprojects.com/) - Web framework
- [OpenCV](https://opencv.org/) - Computer vision library

---
