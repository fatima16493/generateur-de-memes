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

// Déclencheur pour le bouton de fichier
document.getElementById('labelTrigger').addEventListener('click', () => imageInput.click());

// Gestion de l'importation de l'image
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
 * Fonction de retour à la ligne avancée (Mots + Lettres)
 * Cette version empêche tout débordement, même sans espaces.
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
            // SÉCURITÉ : Si le mot seul est trop long pour l'image
            let wordMetrics = context.measureText(words[i]);
            if (wordMetrics.width > maxWidth) {
                let chars = words[i].split('');
                let subWord = '';
                for (let j = 0; j < chars.length; j++) {
                    let testCharLine = currentLine + subWord + chars[j];
                    if (context.measureText(testCharLine).width > maxWidth) {
                        lines.push((currentLine + subWord).trim());
                        currentLine = '';
                        subWord = chars[j];
                    } else {
                        subWord += chars[j];
                    }
                }
                currentLine = subWord + ' ';
            } else {
                currentLine = testLine;
            }
        }
    }
    lines.push(currentLine.trim());

    // Calcul de la position verticale (remonte pour le texte du bas)
    let startY = fromBottom ? y - (lines.length - 1) * lineHeight : y;

    lines.forEach((line, index) => {
        let posY = startY + (index * lineHeight);
        context.strokeText(line, x, posY);
        context.fillText(line, x, posY);
    });
}

/**
 * Fonction principale de dessin
 */
function drawMeme() {
    if (!activeImage) return;

    // Gestion de la taille minimale (800px) pour la qualité et l'espace texte
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
    ctx.drawImage(activeImage, 0, 0, renderWidth, renderHeight);

    // Style du texte
    const size = parseInt(fontSizeRange.value);
    ctx.font = `bold ${size}px Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = size / 5;

    const maxWidth = canvas.width * 0.85; 
    const lineHeight = size * 1.1;

    // Texte Haut
    ctx.textBaseline = 'top';
    wrapText(ctx, topText.value.toUpperCase(), canvas.width / 2, 30, maxWidth, lineHeight, false);

    // Texte Bas
    ctx.textBaseline = 'bottom';
    wrapText(ctx, bottomText.value.toUpperCase(), canvas.width / 2, canvas.height - 30, maxWidth, lineHeight, true);
}

// Mise à jour instantanée lors de la saisie
[topText, bottomText, fontSizeRange].forEach(el => {
    el.addEventListener('input', () => { if(activeImage) drawMeme(); });
});

// Téléchargement
downloadBtn.addEventListener('click', () => {
    if(!activeImage) return alert("Choisissez d'abord une image !");
    const link = document.createElement('a');
    link.download = 'meme_supinfo.png';
    link.href = canvas.toDataURL();
    link.click();
});

// Partage
shareBtn.addEventListener('click', async () => {
    if(!activeImage) return;
    try {
        const blob = await (await fetch(canvas.toDataURL())).blob();
        const file = new File([blob], 'meme.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file] });
        } else {
            alert("Partage non disponible. Utilisez le téléchargement.");
        }
    } catch (e) { console.log("Partage annulé"); }
});

// Galerie
saveBtn.addEventListener('click', () => {
    if(!activeImage) return;
    const saved = JSON.parse(localStorage.getItem('supinfoMemes') || '[]');
    saved.unshift(canvas.toDataURL());
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
    if(confirm("Effacer toute la galerie ?")) {
        localStorage.removeItem('supinfoMemes');
        displayGallery();
    }
});

displayGallery();
