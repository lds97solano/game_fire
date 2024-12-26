// Importar Firebase y los módulos necesarios
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBdUpHlTavwxRE9k8spbsyCOFrpfVgYfpQ",
  authDomain: "game-fire-b7731.firebaseapp.com",
  projectId: "game-fire-b7731",
  storageBucket: "game-fire-b7731.firebasestorage.app",
  messagingSenderId: "119100872825",
  appId: "1:119100872825:web:ae78299a946ecc71a5dca8",
  measurementId: "G-Q6NV2J40CE"
};

// Inicializar Firebase App y Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Función de inicio de sesión
async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Inicio de sesión exitoso:", userCredential.user);
        alert("Inicio de sesión exitoso.");
        // Redirigir al dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error("Error al iniciar sesión:", error.message);
        alert(`Error: ${error.message}`);
    }
}

// Conectar la función al formulario de inicio de sesión
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            loginUser(email, password);
        });
    }
});
