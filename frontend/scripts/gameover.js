import { auth, database } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";

// Obtener los 5 puntajes más altos
document.addEventListener('DOMContentLoaded', () => {
    fetch('http://localhost:3000/top-scores')
        .then(response => response.json())
        .then(data => {
            const topPlayersList = document.getElementById('topPlayers');
            topPlayersList.innerHTML = '';
            data.forEach((player, index) => {
                const listItem = document.createElement('li');
                listItem.textContent = `#${index + 1} - ${player.name}: ${player.score} puntos`;
                topPlayersList.appendChild(listItem);
            });
        })
        .catch(error => console.error('Error al obtener los puntajes:', error));
});

// Obtener el puntaje del jugador actual
onAuthStateChanged(auth, (user) => {
    if (user) {
        fetch(`http://localhost:3000/user-score/${user.uid}`)
            .then(response => response.json())
            .then(data => {
                const currentUserScoreElement = document.getElementById('currentUserScore');
                if (data.score !== undefined) {
                    currentUserScoreElement.textContent = `Tu Puntaje: ${data.score} puntos`;
                } else {
                    currentUserScoreElement.textContent = 'Tu Puntaje: 0 puntos';
                }
            })
            .catch(error => console.error('Error al obtener el puntaje del usuario:', error));
    } else {
        console.error("No hay un usuario autenticado.");
        window.location.href = 'login.html'; // Redirigir si no está autenticado
    }
});

// Configurar botones
document.getElementById('playAgain').addEventListener('click', () => {
    // Redirigir al inicio del juego
    window.location.href = 'game.html';
});

document.getElementById('goHome').addEventListener('click', () => {
    // Redirigir a la página principal
    window.location.href = 'index.html';
});
