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
let fileType = 'image/png'; // Variable pour stocker le format d'origine (JPG ou PNG)

// Déclencheur pour le bouton de fichier
document.getElementById('labelTrigger').addEventListener('click', () => imageInput.click());

// Gestion de l'importation de l'image
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ON DÉTECTE ET ON GARDE LE FORMAT D'ORIGINE
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

/**
 * Fonction de retour à la ligne avancée (Mots + Lettres)
 * Supporte aussi les emojis Unicode
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
            let wordMetrics = context.measureText(words[i]);
            if (wordMetrics.width > maxWidth) {
                let chars = Array.from(words[i]); // Utilise Array.from pour ne pas casser les emojis
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

    const size = parseInt(fontSizeRange.value);
    
    // MISE À JOUR : Support Emoji robuste pour le Canvas
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

[topText, bottomText, fontSizeRange].forEach(el => {
    el.addEventListener('input', () => { if(activeImage) drawMeme(); });
});

// TÉLÉCHARGEMENT OPTIMISÉ (JPG RESTE JPG)
downloadBtn.addEventListener('click', () => {
    if(!activeImage) return alert("Choisissez d'abord une image !");
    
    const link = document.createElement('a');
    
    // Déterminer l'extension pour le nom du fichier
    const extension = (fileType === 'image/jpeg' || fileType === 'image/jpg') ? 'jpg' : 'png';
    link.download = `meme_supinfo.${extension}`;
    
    // On exporte avec le type d'origine
    link.href = canvas.toDataURL(fileType, 0.9);
    link.click();
});

// Partage
shareBtn.addEventListener('click', async () => {
    if(!activeImage) return;
    try {
        const dataUrl = canvas.toDataURL(fileType);
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'meme.png', { type: fileType });
        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file] });
        } else {
            alert("Partage non disponible.");
        }
    } catch (e) { console.log("Partage annulé"); }
});

// Galerie
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
    if(confirm("Effacer toute la galerie ?")) {
        localStorage.removeItem('supinfoMemes');
        displayGallery();
    }
});

displayGallery();
