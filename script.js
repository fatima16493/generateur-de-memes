const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');
const imageInput = document.getElementById('imageInput');
const topText = document.getElementById('topText');
const bottomText = document.getElementById('bottomText');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearGallery');
const galleryContainer = document.getElementById('galleryContainer');

let activeImage = null;

// Gestion du clic sur le sélecteur d'image personnalisé [cite: 8]
document.getElementById('labelTrigger').addEventListener('click', () => imageInput.click());

// Chargement de l'image depuis l'ordinateur [cite: 8]
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

// Dessin du mème avec APERÇU EN TEMPS RÉEL [cite: 10]
function drawMeme() {
    if (!activeImage) return;

    // Ajustement du canvas à la taille de l'image [cite: 4]
    canvas.width = activeImage.width;
    canvas.height = activeImage.height;
    ctx.drawImage(activeImage, 0, 0);

    // Style du texte (Impact classique des mèmes) [cite: 9]
    const fontSize = Math.floor(canvas.width / 12);
    ctx.font = `bold ${fontSize}px Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = fontSize / 6;

    // Texte du Haut [cite: 9]
    ctx.textBaseline = 'top';
    const topVal = topText.value.toUpperCase();
    ctx.strokeText(topVal, canvas.width / 2, 25);
    ctx.fillText(topVal, canvas.width / 2, 25);

    // Texte du Bas [cite: 9]
    ctx.textBaseline = 'bottom';
    const bottomVal = bottomText.value.toUpperCase();
    ctx.strokeText(bottomVal, canvas.width / 2, canvas.height - 25);
    ctx.fillText(bottomVal, canvas.width / 2, canvas.height - 25);
}

// Écouteurs pour l'aperçu instantané [cite: 10]
topText.addEventListener('input', drawMeme);
bottomText.addEventListener('input', drawMeme);

// Fonction de TÉLÉCHARGEMENT [cite: 11]
downloadBtn.addEventListener('click', () => {
    if(!activeImage) return alert("Veuillez d'abord choisir une image !");
    const link = document.createElement('a');
    link.download = 'mon-meme-supinfo.png';
    link.href = canvas.toDataURL();
    link.click();
});

// Fonction de PARTAGE (Optimisée pour Edge/PC/Mobile) [cite: 11]
shareBtn.addEventListener('click', async () => {
    if(!activeImage) return alert("Créez d'abord un mème !");
    
    try {
        const dataUrl = canvas.toDataURL('image/png');
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'meme.png', { type: 'image/png' });

        // Vérifie si le partage de fichier est supporté par le navigateur
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: 'Mon Mème SUPINFO',
                text: 'Regardez le mème que j’ai généré !',
                files: [file]
            });
        } else {
            alert("Le partage n'est pas disponible sur ce navigateur ou cet appareil. Utilisez le bouton 'Télécharger'.");
        }
    } catch (err) {
        console.error("Erreur de partage:", err);
    }
});

// Gestion de la GALERIE (LocalStorage) [cite: 12]
saveBtn.addEventListener('click', () => {
    if(!activeImage) return;
    const dataURL = canvas.toDataURL();
    const savedMemes = JSON.parse(localStorage.getItem('supinfoMemes') || '[]');
    
    // Ajouter au début de la liste
    savedMemes.unshift(dataURL);
    
    // Limiter à 12 mèmes pour ne pas saturer le stockage
    if(savedMemes.length > 12) savedMemes.pop();
    
    localStorage.setItem('supinfoMemes', JSON.stringify(savedMemes));
    displayGallery();
});

// Affichage de la galerie [cite: 12]
function displayGallery() {
    const savedMemes = JSON.parse(localStorage.getItem('supinfoMemes') || '[]');
    galleryContainer.innerHTML = '';
    savedMemes.forEach(meme => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.innerHTML = `<img src="${meme}" alt="Mème sauvegardé">`;
        galleryContainer.appendChild(div);
    });
}

// Vider la galerie
clearBtn.addEventListener('click', () => {
    if(confirm("Voulez-vous vraiment effacer votre galerie ?")) {
        localStorage.removeItem('supinfoMemes');
        displayGallery();
    }
});

// Initialisation au chargement de la page
displayGallery();
