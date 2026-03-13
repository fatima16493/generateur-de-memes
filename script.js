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

// --- VARIABLES D'ÉTAT ---
let activeImage = null;
let elements = []; // Contient tous les textes et emojis {content, x, y, color, size, font, type}
let selectedElementIndex = null;
let currentFilter = 'none';
let isDragging = false;

// --- 1. GESTION DE L'IMAGE & MODÈLES ---
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
    img.crossOrigin = "anonymous"; // Évite les erreurs de sécurité au téléchargement
    img.onload = () => {
        activeImage = img;
        elements = []; // On réinitialise les textes pour une nouvelle image
        drawMeme();
    };
    img.src = src;
}

// --- 2. FILTRES D'AMBIANCE ---
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        currentFilter = btn.getAttribute('data-filter');
        drawMeme();
    });
});

// --- 3. AJOUT DE TEXTES ET EMOJIS ---
addTextBtn.addEventListener('click', () => {
    const val = textInput.value.trim();
    if (val === "") return;
    
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

// --- 4. LOGIQUE DE DÉPLACEMENT ET SÉLECTION ---
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

canvas.addEventListener('mousedown', (e) => {
    if (!activeImage) return;
    const pos = getMousePos(e);
    selectedElementIndex = null;

    // On parcourt à l'envers pour sélectionner l'élément du dessus
    for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        // Détection de clic (boîte de collision simplifiée)
        if (Math.abs(pos.x - el.x) < 100 && Math.abs(pos.y - el.y) < 40) {
            selectedElementIndex = i;
            isDragging = true;
            
            // Synchroniser les contrôles avec l'élément sélectionné
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
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging || selectedElementIndex === null) return;
    const pos = getMousePos(e);
    elements[selectedElementIndex].x = pos.x;
    elements[selectedElementIndex].y = pos.y;
    drawMeme();
});

window.addEventListener('mouseup', () => isDragging = false);

deleteSelectedBtn.addEventListener('click', () => {
    if (selectedElementIndex !== null) {
        elements.splice(selectedElementIndex, 1);
        selectedElementIndex = null;
        deleteSelectedBtn.style.display = 'none';
        drawMeme();
    }
});

// --- 5. DESSIN SUR LE CANVAS ---
function drawMeme() {
    if (!activeImage) return;

    // Mise à l'échelle pour garder une bonne qualité
    const baseWidth = 800;
    const ratio = baseWidth / activeImage.width;
    canvas.width = baseWidth;
    canvas.height = activeImage.height * ratio;

    // Dessin du fond avec filtre
    ctx.filter = currentFilter;
    ctx.drawImage(activeImage, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';

    // Dessin des éléments (Textes et Emojis)
    elements.forEach((el, index) => {
        ctx.font = `bold ${el.size}px "${el.font || 'Impact'}"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (el.type === 'text') {
            ctx.fillStyle = el.color;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = el.size / 6;
            ctx.strokeText(el.content, el.x, el.y);
            ctx.fillText(el.content, el.x, el.y);
        } else {
            // Emojis
            ctx.font = `${el.size}px Arial`;
            ctx.fillText(el.content, el.x, el.y);
        }

        // Indicateur de sélection
        if (selectedElementIndex === index) {
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 3;
            ctx.strokeRect(el.x - 110, el.y - el.size/2 - 10, 220, el.size + 20);
        }
    });
}

// --- 6. SAUVEGARDE ET GALERIE (RÉÉDITABLE) ---
document.getElementById('saveBtn').addEventListener('click', () => {
    if (!activeImage) return;
    
    const memeData = {
        backgroundImage: activeImage.src,
        filter: currentFilter,
        elements: JSON.parse(JSON.stringify(elements)), // Copie profonde
        preview: canvas.toDataURL("image/png")
    };

    const saved = JSON.parse(localStorage.getItem('supinfoMemes') || '[]');
    saved.unshift(memeData);
    if (saved.length > 12) saved.pop();
    localStorage.setItem('supinfoMemes', JSON.stringify(saved));
    displayGallery();
});

function displayGallery() {
    const saved = JSON.parse(localStorage.getItem('supinfoMemes') || '[]');
    galleryContainer.innerHTML = '';
    saved.forEach((meme, index) => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.innerHTML = `<img src="${meme.preview}">`;
        
        // Clic pour rééditer
        div.addEventListener('click', () => {
            const img = new Image();
            img.onload = () => {
                activeImage = img;
                elements = meme.elements;
                currentFilter = meme.filter || 'none';
                drawMeme();
            };
            img.src = meme.backgroundImage;
        });
        galleryContainer.appendChild(div);
    });
}

document.getElementById('downloadBtn').addEventListener('click', () => {
    if (!activeImage) return;
    selectedElementIndex = null; // Enlever le cadre de sélection avant export
    drawMeme();
    const link = document.createElement('a');
    link.download = 'mon_meme_supinfo.png';
    link.href = canvas.toDataURL("image/png");
    link.click();
});

// Initialisation
displayGallery();
