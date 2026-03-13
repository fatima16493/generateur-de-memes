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

let activeImage = null;

// Déclenche l'explorateur de fichiers
document.getElementById('labelTrigger').addEventListener('click', () => imageInput.click());

// Chargement de l'image sélectionnée
imageInput.addEventListener('change', (e) => {
    if (!e.target.files[0]) return;
    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => {
            activeImage = img;
            drawMeme();
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(e.target.files[0]);
});

/**
 * Fonction pour gérer le retour à la ligne automatique (Wrapping)
 */
function wrapText(context, text, x, y, maxWidth, lineHeight, fromBottom = false) {
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
        let testLine = currentLine + words[i] + ' ';
        let metrics = context.measureText(testLine);
        
        if (metrics.width > maxWidth && i > 0) {
            lines.push(currentLine.trim());
            currentLine = words[i] + ' ';
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine.trim());

    // Calcul de la position de départ (pour le texte du bas, on remonte)
    let startY = fromBottom ? y - (lines.length - 1) * lineHeight : y;

    lines.forEach((line, index) => {
        let posY = startY + (index * lineHeight);
        context.strokeText(line, x, posY);
        context.fillText(line, x, posY);
    });
}

/**
 * Dessine le mème sur le Canvas
 */
function drawMeme() {
    if (!activeImage) return;

    // --- STRATÉGIE D'AGRANDISSEMENT ---
    // On force une largeur de 800px minimum pour laisser de la place au texte
    const minWidth = 800;
    let renderWidth = activeImage.width;
    let renderHeight = activeImage.height;

    if (renderWidth < minWidth) {
        const ratio = minWidth / renderWidth;
        renderWidth = minWidth;
        renderHeight = renderHeight * ratio;
    }

    canvas.width = renderWidth;
    canvas.height = renderHeight;
    
    // Dessin de l'image sur le canvas (agrandie si nécessaire)
    ctx.drawImage(activeImage, 0, 0, renderWidth, renderHeight);

    // Configuration du style du texte
    const size = parseInt(fontSizeRange.value);
    ctx.font = `bold ${size}px Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = size / 5; // Épaisseur du contour proportionnelle

    const maxWidth = canvas.width * 0.85; // Marge de sécurité
    const lineHeight = size * 1.1;

    // Texte du Haut
    ctx.textBaseline = 'top';
    wrapText(ctx, topText.value.toUpperCase(), canvas.width / 2, 30, maxWidth, lineHeight, false);

    // Texte du Bas
    ctx.textBaseline = 'bottom';
    wrapText(ctx, bottomText.value.toUpperCase(), canvas.width / 2, canvas.height - 30, maxWidth, lineHeight, true);
}

// Écouteurs pour la mise à jour instantanée
[topText, bottomText, fontSizeRange].forEach(el => {
    el.addEventListener('input', () => {
        if (activeImage) drawMeme();
    });
});

// TÉLÉCHARGEMENT
downloadBtn.addEventListener('click', () => {
    if(!activeImage) return alert("Sélectionnez d'abord une image.");
    const link = document.createElement('a');
    link.download = 'mon-meme.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});

// PARTAGE (Mobile & Navigateurs compatibles)
shareBtn.addEventListener('click', async () => {
    if(!activeImage) return;
    try {
        const dataUrl = canvas.toDataURL();
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'meme.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Mon Mème' });
        } else {
            alert("Partage non supporté. Téléchargez l'image !");
        }
    } catch (err) { console.log("Partage annulé"); }
});

// GALERIE (LocalStorage)
saveBtn.addEventListener('click', () => {
    if(!activeImage) return;
    const saved = JSON.parse(localStorage.getItem('supinfoMemes') || '[]');
    saved.unshift(canvas.toDataURL());
    if(saved.length > 12) saved.pop(); // Garde les 12 derniers
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
    if(confirm("Vider la galerie ?")) {
        localStorage.removeItem('supinfoMemes');
        displayGallery();
    }
});

// Initialisation de la galerie au chargement
displayGallery();
