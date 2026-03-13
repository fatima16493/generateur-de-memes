const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');

// --- SÉLECTEURS ---
const imageInput = document.getElementById('imageInput');
const textInput = document.getElementById('textInput');
const addTextBtn = document.getElementById('addTextBtn');
const textColor = document.getElementById('textColor');
const fontSizeRange = document.getElementById('fontSizeRange');
const fontSelect = document.getElementById('fontSelect');
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
const galleryContainer = document.getElementById('galleryContainer');
const shareBtn = document.getElementById('shareBtn');
const clearGalleryBtn = document.getElementById('clearGallery');

// --- VARIABLES D'ÉTAT ---
let activeImage = null;
let elements = []; 
let selectedElementIndex = null;
let currentFilter = 'none';
let isDragging = false;

// --- 1. FONCTION DE RETOUR À LA LIGNE (WRAPPING) ---
function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let testY = y;

    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = context.measureText(testLine);
        let testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
            context.strokeText(line, x, testY);
            context.fillText(line, x, testY);
            line = words[n] + ' ';
            testY += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.strokeText(line, x, testY);
    context.fillText(line, x, testY);
}

// --- 2. GESTION DE L'IMAGE & MODÈLES ---
document.getElementById('labelTrigger').addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => loadBaseImage(event.target.result);
    reader.readAsDataURL(file);
});

document.querySelectorAll('.template-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => loadBaseImage(thumb.src));
});

function loadBaseImage(src) {
    const img = new Image();
    img.crossOrigin = "anonymous"; 
    img.onload = () => {
        activeImage = img;
        elements = []; 
        selectedElementIndex = null;
        drawMeme();
    };
    img.onerror = () => alert("Erreur lors du chargement de l'image.");
    img.src = src;
}

// --- 3. MISE À JOUR EN DIRECT ---
[textColor, fontSizeRange, fontSelect].forEach(control => {
    control.addEventListener('input', () => {
        if (selectedElementIndex !== null) {
            const el = elements[selectedElementIndex];
            if (el.type === 'text') {
                el.color = textColor.value;
                el.size = parseInt(fontSizeRange.value);
                el.font = fontSelect.value;
                drawMeme();
            }
        }
    });
});

// --- 4. FILTRES D'AMBIANCE ---
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        currentFilter = btn.getAttribute('data-filter');
        drawMeme();
    });
});

// --- 5. AJOUT DE TEXTES ET EMOJIS ---
addTextBtn.addEventListener('click', () => {
    const val = textInput.value.trim();
    if (val === "" || !activeImage) return;
    
    elements.push({
        content: val,
        x: canvas.width / 2,
        y: canvas.height / 2,
        color: textColor.value,
        size: parseInt(fontSizeRange.value),
        font: fontSelect.value,
        type: 'text'
    });
    
    textInput.value = "";
    drawMeme();
});

document.querySelectorAll('.emoji-item').forEach(emoji => {
    emoji.addEventListener('click', () => {
        if (!activeImage) return;
        elements.push({
            content: emoji.innerText,
            x: canvas.width / 2,
            y: canvas.height / 2,
            size: 80,
            type: 'emoji'
        });
        drawMeme();
    });
});

// --- 6. LOGIQUE DE DÉPLACEMENT ET SÉLECTION ---
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
}

const startDrag = (e) => {
    if (!activeImage) return;
    const pos = getMousePos(e);
    selectedElementIndex = null;

    for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (Math.abs(pos.x - el.x) < 100 && Math.abs(pos.y - el.y) < 40) {
            selectedElementIndex = i;
            isDragging = true;
            if (el.type === 'text') {
                textInput.value = el.content;
                textColor.value = el.color;
                fontSizeRange.value = el.size;
                fontSelect.value = el.font;
            }
            deleteSelectedBtn.style.display = 'block';
            drawMeme();
            return;
        }
    }
    deleteSelectedBtn.style.display = 'none';
    drawMeme();
};

canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('touchstart', startDrag);
window.addEventListener('mousemove', (e) => {
    if (!isDragging || selectedElementIndex === null) return;
    const pos = getMousePos(e);
    elements[selectedElementIndex].x = pos.x;
    elements[selectedElementIndex].y = pos.y;
    drawMeme();
});
window.addEventListener('mouseup', () => isDragging = false);
window.addEventListener('touchend', () => isDragging = false);

deleteSelectedBtn.addEventListener('click', () => {
    if (selectedElementIndex !== null) {
        elements.splice(selectedElementIndex, 1);
        selectedElementIndex = null;
        deleteSelectedBtn.style.display = 'none';
        drawMeme();
    }
});

// --- 7. DESSIN SUR LE CANVAS ---
function drawMeme() {
    if (!activeImage) return;

    const baseWidth = 800;
    const ratio = baseWidth / activeImage.width;
    canvas.width = baseWidth;
    canvas.height = activeImage.height * ratio;

    ctx.filter = currentFilter;
    ctx.drawImage(activeImage, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';

    elements.forEach((el, index) => {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (el.type === 'text') {
            ctx.font = `bold ${el.size}px "${el.font || 'Impact'}"`;
            ctx.fillStyle = el.color;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = el.size / 7;

            const maxWidth = canvas.width - 60; 
            const lineHeight = el.size * 1.1; 
            wrapText(ctx, el.content, el.x, el.y, maxWidth, lineHeight);
        } else {
            ctx.font = `${el.size}px Arial`;
            ctx.fillText(el.content, el.x, el.y);
        }

        if (selectedElementIndex === index) {
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(el.x - 110, el.y - el.size/2 - 10, 220, el.size + 20);
            ctx.setLineDash([]);
        }
    });
}

// --- 8. ACTIONS FINALES ---

// Téléchargement
document.getElementById('downloadBtn').addEventListener('click', () => {
    if (!activeImage) return;
    selectedElementIndex = null; 
    drawMeme();
    const link = document.createElement('a');
    link.download = 'meme_supinfo.png';
    link.href = canvas.toDataURL("image/png");
    link.click();
});

// Partage
shareBtn.addEventListener('click', async () => {
    if (!activeImage) return;
    try {
        selectedElementIndex = null;
        drawMeme();
        const dataUrl = canvas.toDataURL("image/png");
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'meme.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Meme Generator SUPINFO' });
        } else {
            const link = document.createElement('a');
            link.download = 'meme_export.png';
            link.href = dataUrl;
            link.click();
            alert("Partage direct non supporté. Image téléchargée.");
        }
    } catch (err) { console.error(err); }
});

// Sauvegarde Locale
document.getElementById('saveBtn').addEventListener('click', () => {
    if (!activeImage) return;
    const memeData = {
        backgroundImage: activeImage.src,
        filter: currentFilter,
        elements: JSON.parse(JSON.stringify(elements)),
        preview: canvas.toDataURL("image/png")
    };
    const saved = JSON.parse(localStorage.getItem('supinfoMemes') || '[]');
    saved.unshift(memeData);
    localStorage.setItem('supinfoMemes', JSON.stringify(saved.slice(0, 12)));
    displayGallery();
});

clearGalleryBtn.addEventListener('click', () => {
    if (confirm("Vider la galerie ?")) {
        localStorage.removeItem('supinfoMemes');
        displayGallery();
    }
});

function displayGallery() {
    const saved = JSON.parse(localStorage.getItem('supinfoMemes') || '[]');
    galleryContainer.innerHTML = '';
    saved.forEach((meme) => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.innerHTML = `<img src="${meme.preview}">`;
        div.onclick = () => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                activeImage = img;
                elements = meme.elements;
                currentFilter = meme.filter || 'none';
                drawMeme();
            };
            img.src = meme.backgroundImage;
        };
        galleryContainer.appendChild(div);
    });
}

displayGallery();
