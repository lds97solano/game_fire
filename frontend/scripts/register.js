// Importar Firebase y los módulos necesarios
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

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

// Función de registro de usuario
async function registerUser(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Usuario registrado:", userCredential.user);
        alert("Registro exitoso. Ahora puedes iniciar sesión.");
        // Redirigir al login después de registrarse
        window.location.href = 'login.html';
    } catch (error) {
        console.error("Error al registrar usuario:", error.message);
        alert(`Error: ${error.message}`);
    }
}

// Conectar la función al formulario de registro
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            // Verificar si las contraseñas coinciden
            if (password !== confirmPassword) {
                alert("Las contraseñas no coinciden.");
                return;
            }

            // Registrar usuario
            registerUser(email, password);
        });
    }
});
