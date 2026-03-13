const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');
const imageInput = document.getElementById('imageInput');
const topText = document.getElementById('topText');
const bottomText = document.getElementById('bottomText');
const fontSizeRange = document.getElementById('fontSizeRange');
const fontSelect = document.getElementById('fontSelect');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const saveBtn = document.getElementById('saveBtn');
const galleryContainer = document.getElementById('galleryContainer');
const emojiListTop = document.getElementById('emojiListTop');
const emojiListBottom = document.getElementById('emojiListBottom');

let activeImage = null;
let fileType = 'image/png'; 

// --- VARIABLES POUR LE DÉPLACEMENT (DRAG & DROP) ---
let topPos = { x: 0, y: 0, isDragging: false };
let bottomPos = { x: 0, y: 0, isDragging: false };

// --- GESTION DES EMOJIS ---
function closeEmojis() {
    emojiListTop.style.display = 'none';
    emojiListBottom.style.display = 'none';
}

document.querySelectorAll('.emoji-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = btn.getAttribute('data-target');
        const list = document.getElementById(targetId);
        const isVisible = list.style.display === 'grid';
        closeEmojis();
        if (!isVisible) list.style.display = 'grid';
    });
});

document.querySelectorAll('.emoji-list span').forEach(emoji => {
    emoji.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const listId = emoji.closest('.emoji-list').id;
        const targetInput = listId === 'emojiListTop' ? topText : bottomText;
        targetInput.value += emoji.innerText;
        drawMeme();
        targetInput.focus();
    });
});

document.addEventListener('click', closeEmojis);

// --- IMPORT IMAGE ---
document.getElementById('labelTrigger').addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    fileType = file.type;
    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => { 
            activeImage = img;
            topPos.y = 0; // Force le repositionnement par défaut
            drawMeme(); 
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
});

// --- LOGIQUE DE DÉPLACEMENT (SOURIS) ---
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
    const size = parseInt(fontSizeRange.value);

    if (Math.abs(pos.y - topPos.y) < size) {
        topPos.isDragging = true;
    } else if (Math.abs(pos.y - bottomPos.y) < size) {
        bottomPos.isDragging = true;
    }
});

window.addEventListener('mousemove', (e) => {
    if (!topPos.isDragging && !bottomPos.isDragging) return;
    const pos = getMousePos(e);

    if (topPos.isDragging) {
        topPos.x = pos.x;
        topPos.y = pos.y;
    } else if (bottomPos.isDragging) {
        bottomPos.x = pos.x;
        bottomPos.y = pos.y;
    }
    drawMeme();
});

window.addEventListener('mouseup', () => {
    topPos.isDragging = false;
    bottomPos.isDragging = false;
});

// --- DESSIN DU MEME ---
function wrapText(context, text, x, y, maxWidth, lineHeight, fromBottom = false) {
    if (!text) return;
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
        let testLine = currentLine + words[i] + ' ';
        if (context.measureText(testLine).width > maxWidth && i > 0) {
            lines.push(currentLine.trim());
            currentLine = words[i] + ' ';
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine.trim());

    let startY = fromBottom ? y - (lines.length - 1) * lineHeight : y;
    lines.forEach((line, index) => {
        let posY = startY + (index * lineHeight);
        context.strokeText(line, x, posY);
        context.fillText(line, x, posY);
    });
}

function drawMeme() {
    if (!activeImage) return;

    const minWidth = 800;
    let rW = activeImage.width;
    let rH = activeImage.height;
    if (rW < minWidth) {
        const ratio = minWidth / rW;
        rW = minWidth; rH = rH * ratio;
    }
    canvas.width = rW; canvas.height = rH;
    ctx.drawImage(activeImage, 0, 0, rW, rH);

    const size = parseInt(fontSizeRange.value);
    const font = fontSelect.value;
    
    if (topPos.y === 0) {
        topPos = { x: canvas.width / 2, y: size + 20, isDragging: false };
        bottomPos = { x: canvas.width / 2, y: canvas.height - size, isDragging: false };
    }

    // Correction Police : Ajout des guillemets pour les noms composés
    ctx.font = `bold ${size}px "${font}", Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = size / 5;

    const maxWidth = canvas.width * 0.9;
    const lineHeight = size * 1.1;

    ctx.textBaseline = 'middle';
    wrapText(ctx, topText.value.toUpperCase(), topPos.x, topPos.y, maxWidth, lineHeight, false);
    wrapText(ctx, bottomText.value.toUpperCase(), bottomPos.x, bottomPos.y, maxWidth, lineHeight, true);
}

// --- ÉVÉNEMENTS ---
[topText, bottomText, fontSizeRange].forEach(el => {
    el.addEventListener('input', () => { if(activeImage) drawMeme(); });
});

fontSelect.addEventListener('change', () => {
    if(activeImage) drawMeme();
});

// --- BOUTONS (TELECHARGEMENT & PARTAGE) ---
downloadBtn.addEventListener('click', () => {
    if(!activeImage) return alert("Choisissez une image !");
    const link = document.createElement('a');
    link.download = `meme_supinfo.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
});

shareBtn.addEventListener('click', async () => {
    if (!activeImage) return alert("Créez un mème d'abord !");
    try {
        const dataUrl = canvas.toDataURL("image/png");
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'meme_supinfo.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'Mon Mème SUPINFO',
                text: 'Regarde ma création !'
            });
        } else if (navigator.share) {
            await navigator.share({
                title: 'Mon Mème SUPINFO',
                url: window.location.href
            });
        } else {
            alert("Partage non supporté ici. Téléchargez l'image !");
        }
    } catch (err) {
        console.error(err);
        alert("Erreur de partage (nécessite HTTPS sur certains navigateurs).");
    }
});

saveBtn.addEventListener('click', () => {
    if(!activeImage) return;
    const saved = JSON.parse(localStorage.getItem('supinfoMemes') || '[]');
    saved.unshift(canvas.toDataURL("image/png"));
    if(saved.length > 12) saved.pop();
    localStorage.setItem('supinfoMemes', JSON.stringify(saved));
    displayGallery();
});

function displayGallery() {
    const saved = JSON.parse(localStorage.getItem('supinfoMemes') || '[]');
    galleryContainer.innerHTML = '';
    saved.forEach(meme => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.innerHTML = `<img src="${meme}">`;
        galleryContainer.appendChild(div);
    });
}

document.getElementById('clearGallery').addEventListener('click', () => {
    if(confirm("Effacer la galerie ?")) {
        localStorage.removeItem('supinfoMemes');
        displayGallery();
    }
});

displayGallery();
