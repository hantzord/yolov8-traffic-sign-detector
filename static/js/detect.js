let currentFile = null;

document.querySelectorAll(".drop-zone").forEach(dropZone => {
    const input = dropZone.querySelector(".drop-zone__input");

    dropZone.addEventListener("click", () => {
        input.click();
    });

    input.addEventListener("change", (e) => {
        if (input.files.length) {
            handleFile(input.files[0]);
        }
    });

    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("drop-zone--over");
    });

    ["dragleave", "dragend"].forEach(type => {
        dropZone.addEventListener(type, () => {
            dropZone.classList.remove("drop-zone--over");
        });
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("drop-zone--over");

        if (e.dataTransfer.files.length) {
            // Create a DataTransfer object
            const dataTransfer = new DataTransfer();
            // Add the dragged file to it
            dataTransfer.items.add(e.dataTransfer.files[0]);
            // Set the input's files
            input.files = dataTransfer.files;
            handleFile(e.dataTransfer.files[0]);
        }
    });
});

function handleFile(file) {
    if (file.type.startsWith("image/")) {
        currentFile = file;
        updateThumbnail(document.querySelector(".drop-zone"), file);
        showPreviewModal(file);
    } else {
        alert("Please upload an image file!");
    }
}

function showPreviewModal(file) {
    const modal = document.getElementById("previewModal");
    const previewImage = document.getElementById("modalPreviewImage");
    
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    modal.classList.add("show");
}

function closeModal() {
    const modal = document.getElementById("previewModal");
    modal.classList.remove("show");
    
    // Reset the upload form and current file
    document.getElementById("upload-form").reset();
    currentFile = null;
    resetDropZone();
}

function confirmUpload() {
    if (currentFile) {
        document.getElementById("upload-form").submit();
    }
}

function resetDropZone() {
    const dropZone = document.querySelector(".drop-zone");
    const thumb = dropZone.querySelector(".drop-zone__thumb");
    
    if (thumb) {
        thumb.remove();
    }
    
    const prompt = document.createElement("span");
    prompt.classList.add("drop-zone__prompt");
    prompt.innerHTML = `
        <i class="fas fa-cloud-upload-alt drop-zone__icon"></i>
        <span>Drop your image here or click to upload</span>
    `;
    
    dropZone.appendChild(prompt);
}

function updateThumbnail(dropZone, file) {
    let thumbnailElement = dropZone.querySelector(".drop-zone__thumb");

    if (dropZone.querySelector(".drop-zone__prompt")) {
        dropZone.querySelector(".drop-zone__prompt").remove();
    }

    if (!thumbnailElement) {
        thumbnailElement = document.createElement("div");
        thumbnailElement.classList.add("drop-zone__thumb");
        dropZone.appendChild(thumbnailElement);
    }

    thumbnailElement.dataset.label = file.name;

    if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            thumbnailElement.style.backgroundImage = `url('${reader.result}')`;
        };
    } else {
        thumbnailElement.style.backgroundImage = null;
    }
}

// Fungsi untuk memperbarui slider
function updateSlider(slider) {
    // Update teks nilai
    const value = slider.value;
    const confValue = document.getElementById('conf_value');
    
    // Tambahkan animasi pada perubahan nilai
    confValue.classList.add('scale-animation');
    setTimeout(() => {
        confValue.classList.remove('scale-animation');
    }, 200);
    
    confValue.textContent = value;
    
    // Hitung persentase untuk gradient background
    const percent = ((value - slider.min) / (slider.max - slider.min)) * 100;
    
    // Update warna background slider sesuai dengan nilai
    slider.style.background = `linear-gradient(to right, #007bff 0%, #007bff ${percent}%, #e9ecef ${percent}%, #e9ecef 100%)`;
    
    // Ubah warna badge berdasarkan nilai confidence
    if (value < 0.25) {
        confValue.style.background = '#28a745'; // hijau untuk nilai rendah (lebih sensitif)
        confValue.innerHTML = `<i class="fas fa-check-double me-1"></i>${value}`;
    } else if (value < 0.5) {
        confValue.style.background = '#007bff'; // biru untuk nilai sedang
        confValue.innerHTML = `<i class="fas fa-check me-1"></i>${value}`;
    } else {
        confValue.style.background = '#dc3545'; // merah untuk nilai tinggi (kurang sensitif)
        confValue.innerHTML = `<i class="fas fa-filter me-1"></i>${value}`;
    }
    
    // Update badges di bawah slider berdasarkan nilai
    const lowBadge = document.querySelector('.badge.bg-success');
    const highBadge = document.querySelector('.badge.bg-danger');
    
    if (lowBadge && highBadge) {
        // Atur opacity badge berdasarkan nilai slider
        lowBadge.style.opacity = 1 - (percent / 100);
        highBadge.style.opacity = percent / 100;
    }
    
    // Update tanda aktif pada slider
    updateActiveTick(value);
}

// Inisialisasi slider saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    const slider = document.getElementById('conf_threshold');
    if (slider) {
        updateSlider(slider);
        createSliderTicks(slider);
    }
    
    // Inisialisasi tombol redetect jika ada
    const redetectBtn = document.getElementById('redetect-btn');
    if (redetectBtn) {
        redetectBtn.addEventListener('click', handleRedetect);
    }
});

// Fungsi untuk menangani klik tombol redetect
function handleRedetect() {
    const btn = document.getElementById('redetect-btn');
    const sliderValue = document.getElementById('conf_threshold').value;
    
    // Tampilkan loading state
    const originalContent = btn.innerHTML;
    btn.innerHTML = `<span class="loading-spinner"></span>Processing...`;
    btn.disabled = true;
    
    // Simpan nilai confidence yang dipilih untuk dibandingkan
    const currentThreshold = document.getElementById('conf_threshold').value;
    
    // Cek apakah settingan berubah
    if (window.lastThreshold && window.lastThreshold === currentThreshold) {
        // Jika tidak berubah, tampilkan pesan
        setTimeout(() => {
            btn.classList.add('btn-warning');
            btn.innerHTML = `<i class="fas fa-exclamation-triangle me-1"></i>No changes to apply`;
            
            setTimeout(() => {
                btn.classList.remove('btn-warning');
                btn.innerHTML = originalContent;
                btn.disabled = false;
            }, 2000);
        }, 800);
        return;
    }
    
    // Simpan threshold saat ini
    window.lastThreshold = currentThreshold;
    
    // Biarkan form submission berjalan (handled oleh script di detect.html)
}

// Fungsi untuk membuat tanda/garis pada slider
function createSliderTicks(slider) {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const step = parseFloat(slider.step);
    const ticksContainer = document.getElementById('range-ticks');
    
    if (!ticksContainer) return;
    
    // Bersihkan container terlebih dahulu
    ticksContainer.innerHTML = '';
    
    // Buat tanda/garis untuk setiap nilai
    for (let value = min; value <= max; value = parseFloat((value + step).toFixed(2))) {
        const tick = document.createElement('div');
        tick.className = 'form-range-tick';
        tick.setAttribute('data-value', value);
        
        // Tandai nilai yang penting
        if (value === 0.1 || value === 0.25 || value === 0.5 || value === 0.75 || value === 0.9) {
            tick.classList.add('active');
            tick.setAttribute('data-value', value);
        } else {
            tick.setAttribute('data-value', '');
        }
        
        ticksContainer.appendChild(tick);
    }
    
    // Update tanda aktif berdasarkan nilai saat ini
    updateActiveTick(slider.value);
}

// Fungsi untuk mengupdate tanda aktif pada slider
function updateActiveTick(value) {
    const ticks = document.querySelectorAll('.form-range-tick');
    
    ticks.forEach(tick => {
        // Hapus class current-tick dari semua ticks
        tick.classList.remove('current-tick');
        
        const tickValue = tick.getAttribute('data-value');
        // Jika ini adalah tick dengan nilai yang sama dengan slider
        if (tickValue === value) {
            tick.classList.add('current-tick');
        }
    });
} 