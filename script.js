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
let elements = []; // {content, x, y, color, size, font, type}
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
    // CRUCIAL : Permet de manipuler l'image et de la télécharger sans erreur de sécurité
    img.crossOrigin = "anonymous"; 
    
    img.onload = () => {
        activeImage = img;
        elements = []; // On réinitialise pour une nouvelle création
        selectedElementIndex = null;
        drawMeme();
    };
    img.onerror = () => alert("Impossible de charger l'image. Vérifiez votre connexion.");
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

// --- 4. LOGIQUE DE DÉPLACEMENT ET SÉLECTION ---
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Support pour mobile et souris
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

const startDrag = (e) => {
    if (!activeImage) return;
    const pos = getMousePos(e);
    selectedElementIndex = null;

    for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        // Zone de clic approximative
        if (Math.abs(pos.x - el.x) < 80 && Math.abs(pos.y - el.y) < 40) {
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

// --- 5. DESSIN SUR LE CANVAS ---
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
            ctx.strokeText(el.content, el.x, el.y);
            ctx.fillText(el.content, el.x, el.y);
        } else {
            ctx.font = `${el.size}px Arial`;
            ctx.fillText(el.content, el.x, el.y);
        }

        if (selectedElementIndex === index) {
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(el.x - 100, el.y - el.size/2 - 5, 200, el.size + 10);
            ctx.setLineDash([]);
        }
    });
}

// --- 6. ACTIONS (DOWNLOAD, SHARE, SAVE) ---

// Télécharger
document.getElementById('downloadBtn').addEventListener('click', () => {
    if (!activeImage) return;
    selectedElementIndex = null; 
    drawMeme();
    const link = document.createElement('a');
    link.download = 'meme_supinfo.png';
    link.href = canvas.toDataURL("image/png");
    link.click();
});

// Partager
shareBtn.addEventListener('click', async () => {
    if (!activeImage) return;
    const dataUrl = canvas.toDataURL("image/png");
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], 'meme.png', { type: 'image/png' });

    if (navigator.share) {
        navigator.share({
            files: [file],
            title: 'Mon Mème SUPINFO',
            text: 'Regarde le mème que je viens de créer !'
        }).catch(console.error);
    } else {
        alert("Le partage n'est pas supporté sur ce navigateur (utilisez HTTPS).");
    }
});

// Sauvegarder en Galerie
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

// Effacer la galerie
clearGalleryBtn.addEventListener('click', () => {
    if (confirm("Voulez-vous vraiment vider votre galerie ?")) {
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

// Init
displayGallery();
