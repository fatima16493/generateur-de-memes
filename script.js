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

// Gestion du clic sur le sélecteur
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

// Dessin du mème (Aperçu temps réel)
function drawMeme() {
    if (!activeImage) return;

    canvas.width = activeImage.width;
    canvas.height = activeImage.height;
    ctx.drawImage(activeImage, 0, 0);

    const fontSize = Math.floor(canvas.width / 12);
    ctx.font = `bold ${fontSize}px Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = fontSize / 6;

    // Texte Haut
    ctx.textBaseline = 'top';
    const topVal = topText.value.toUpperCase();
    ctx.strokeText(topVal, canvas.width / 2, 25);
    ctx.fillText(topVal, canvas.width / 2, 25);

    // Texte Bas
    ctx.textBaseline = 'bottom';
    const bottomVal = bottomText.value.toUpperCase();
    ctx.strokeText(bottomVal, canvas.width / 2, canvas.height - 25);
    ctx.fillText(bottomVal, canvas.width / 2, canvas.height - 25);
}

topText.addEventListener('input', drawMeme);
bottomText.addEventListener('input', drawMeme);

// Téléchargement
downloadBtn.addEventListener('click', () => {
    if(!activeImage) return alert("Veuillez d'abord choisir une image !");
    const link = document.createElement('a');
    link.download = 'mon-meme.png';
    link.href = canvas.toDataURL();
    link.click();
});

// PARTAGE (API Web Share)
shareBtn.addEventListener('click', async () => {
    if(!activeImage) return alert("Créez d'abord un mème !");
    
    const dataUrl = canvas.toDataURL('image/png');
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], 'meme.png', { type: 'image/png' });

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Mon Mème',
                files: [file]
            });
        } catch (err) { console.log("Partage annulé"); }
    } else {
        alert("Le partage n'est pas supporté sur ce navigateur. Téléchargez l'image à la place !");
    }
});

// GALERIE (LocalStorage)
saveBtn.addEventListener('click', () => {
    if(!activeImage) return;
    const dataURL = canvas.toDataURL();
    const savedMemes = JSON.parse(localStorage.getItem('supinfoMemes') || '[]');
    savedMemes.unshift(dataURL);
    if(savedMemes.length > 12) savedMemes.pop();
    localStorage.setItem('supinfoMemes', JSON.stringify(savedMemes));
    displayGallery();
});

function displayGallery() {
    const savedMemes = JSON.parse(localStorage.getItem('supinfoMemes') || '[]');
    galleryContainer.innerHTML = '';
    savedMemes.forEach(meme => {
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