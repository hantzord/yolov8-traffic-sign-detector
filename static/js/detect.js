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