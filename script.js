const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');
const imageInput = document.getElementById('imageInput');
const topText = document.getElementById('topText');
const bottomText = document.getElementById('bottomText');
const fontSizeRange = document.getElementById('fontSizeRange');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const saveBtn = document.getElementById('saveBtn');
const galleryContainer = document.getElementById('galleryContainer');
const emojiBtn = document.getElementById('emojiBtn');
const emojiList = document.getElementById('emojiList');

let activeImage = null;
let fileType = 'image/png'; 
let lastFocusedInput = topText; // Par défaut sur le champ du haut

// --- GESTION DES EMOJIS ---
// On mémorise quel champ de texte l'utilisateur a cliqué en dernier
topText.addEventListener('focus', () => lastFocusedInput = topText);
bottomText.addEventListener('focus', () => lastFocusedInput = bottomText);

// Afficher/Cacher la liste d'emojis
emojiBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Empêche la fermeture immédiate
    emojiList.style.display = emojiList.style.display === 'none' ? 'grid' : 'none';
});

// Insertion de l'emoji au clic
document.querySelectorAll('#emojiList span').forEach(emoji => {
    emoji.addEventListener('click', () => {
        lastFocusedInput.value += emoji.innerText;
        drawMeme(); // Met à jour le canvas
        lastFocusedInput.focus(); // Garde le curseur dans le champ
        emojiList.style.display = 'none';
    });
});

// Ferme la liste si on clique ailleurs sur la page
document.addEventListener('click', () => {
    emojiList.style.display = 'none';
});

// --- IMPORTATION DE L'IMAGE ---
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
            drawMeme();
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
});

// --- LOGIQUE DU DESSIN (WRAPPING + RENDU) ---
function wrapText(context, text, x, y, maxWidth, lineHeight, fromBottom = false) {
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
        let testLine = currentLine + words[i] + ' ';
        if (context.measureText(testLine).width > maxWidth && i > 0) {
            lines.push(currentLine.trim());
            currentLine = words[i] + ' ';
        } else {
            let wordMetrics = context.measureText(words[i]);
            if (wordMetrics.width > maxWidth) {
                let chars = Array.from(words[i]); 
                let subWord = '';
                for (let char of chars) {
                    if (context.measureText(currentLine + subWord + char).width > maxWidth) {
                        lines.push((currentLine + subWord).trim());
                        currentLine = '';
                        subWord = char;
                    } else {
                        subWord += char;
                    }
                }
                currentLine = subWord + ' ';
            } else {
                currentLine = testLine;
            }
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
        rW = minWidth;
        rH = rH * ratio;
    }
    canvas.width = rW;
    canvas.height = rH;
    ctx.drawImage(activeImage, 0, 0, rW, rH);

    const size = parseInt(fontSizeRange.value);
    ctx.font = `bold ${size}px Impact, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = size / 5;

    const maxWidth = canvas.width * 0.85; 
    const lineHeight = size * 1.1;

    ctx.textBaseline = 'top';
    wrapText(ctx, topText.value.toUpperCase(), canvas.width / 2, 30, maxWidth, lineHeight, false);
    ctx.textBaseline = 'bottom';
    wrapText(ctx, bottomText.value.toUpperCase(), canvas.width / 2, canvas.height - 30, maxWidth, lineHeight, true);
}

// --- ÉVÉNEMENTS & BOUTONS ---
[topText, bottomText, fontSizeRange].forEach(el => {
    el.addEventListener('input', () => { if(activeImage) drawMeme(); });
});

downloadBtn.addEventListener('click', () => {
    if(!activeImage) return alert("Choisissez une image !");
    const link = document.createElement('a');
    const ext = (fileType === 'image/jpeg' || fileType === 'image/jpg') ? 'jpg' : 'png';
    link.download = `meme_supinfo.${ext}`;
    link.href = canvas.toDataURL(fileType, 0.9);
    link.click();
});

saveBtn.addEventListener('click', () => {
    if(!activeImage) return;
    const saved = JSON.parse(localStorage.getItem('supinfoMemes') || '[]');
    saved.unshift(canvas.toDataURL(fileType));
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
