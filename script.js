const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');
const imageInput = document.getElementById('imageInput');
const topText = document.getElementById('topText');
const bottomText = document.getElementById('bottomText');
const fontSizeRange = document.getElementById('fontSizeRange');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearGallery');
const galleryContainer = document.getElementById('galleryContainer');

let activeImage = null;

// Déclencheur du sélecteur d'image
document.getElementById('labelTrigger').addEventListener('click', () => imageInput.click());

// Chargement de l'image
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

// FONCTION POUR GÉRER LES TEXTES LONGS (Wrapping)
function wrapText(context, text, x, y, maxWidth, lineHeight, fromBottom = false) {
    const words = text.split(' ');
    let line = '';
    let lines = [];

    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = context.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    lines.forEach((l, index) => {
        // Si c'est le texte du bas, on remonte les lignes vers le haut
        let posY = fromBottom ? y - (lines.length - 1 - index) * lineHeight : y + index * lineHeight;
        context.strokeText(l.trim(), x, posY);
        context.fillText(l.trim(), x, posY);
    });
}

// DESSIN DU MÉME
function drawMeme() {
    if (!activeImage) return;

    canvas.width = activeImage.width;
    canvas.height = activeImage.height;
    ctx.drawImage(activeImage, 0, 0);

    const size = parseInt(fontSizeRange.value);
    ctx.font = `bold ${size}px Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = size / 6;

    const maxWidth = canvas.width * 0.9; 
    const lineHeight = size * 1.1;

    // Rendu Texte Haut
    ctx.textBaseline = 'top';
    wrapText(ctx, topText.value.toUpperCase(), canvas.width / 2, 20, maxWidth, lineHeight, false);

    // Rendu Texte Bas
    ctx.textBaseline = 'bottom';
    wrapText(ctx, bottomText.value.toUpperCase(), canvas.width / 2, canvas.height - 20, maxWidth, lineHeight, true);
}

// Mise à jour en temps réel
[topText, bottomText, fontSizeRange].forEach(el => el.addEventListener('input', drawMeme));

// TÉLÉCHARGEMENT
downloadBtn.addEventListener('click', () => {
    if(!activeImage) return alert("Choisissez une image !");
    const link = document.createElement('a');
    link.download = 'meme-genere.png';
    link.href = canvas.toDataURL();
    link.click();
});

// PARTAGE
shareBtn.addEventListener('click', async () => {
    if(!activeImage) return alert("Créez d'abord un mème !");
    try {
        const blob = await (await fetch(canvas.toDataURL())).blob();
        const file = new File([blob], 'meme.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({ title: 'Mon Mème', files: [file] });
        } else {
            alert("Partage non supporté sur cet appareil. Utilisez 'Télécharger'.");
        }
    } catch (err) { console.log("Partage annulé"); }
});

// GALERIE
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

clearBtn.addEventListener('click', () => {
    if(confirm("Vider la galerie ?")) {
        localStorage.removeItem('supinfoMemes');
        displayGallery();
    }
});

displayGallery();
