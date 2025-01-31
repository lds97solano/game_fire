import { auth, GoogleAuthProvider, signInWithPopup } from "./firebase-config.js";

// Función para iniciar sesión con correo y contraseña a través del backend
async function signInWithEmail(email, password) {
    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }

        const data = await response.json();
        console.log('Inicio de sesión exitoso. Token:', data.token);

        // Guarda el token en el almacenamiento local
        localStorage.setItem('authToken', data.token);
        window.location.href = 'payment.html'; // Redirige al juego
        
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        alert(`Error: ${error.message}`);
    }
}

// Manejar el formulario de inicio de sesión
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    signInWithEmail(email, password);
});

// Función para iniciar sesión con Google
async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        console.log("Intentando iniciar sesión con Google...");
        const result = await signInWithPopup(auth, provider);
        const idToken = await result.user.getIdToken();

        console.log("Token de ID de Google obtenido:", idToken);

        // Enviar el token de Google al backend
        const response = await fetch('http://localhost:3000/login-google', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }

        const data = await response.json();
        console.log('Inicio de sesión con Google exitoso. Token:', data.token);

        // Guarda el token personalizado en el almacenamiento local
        localStorage.setItem('authToken', data.token);
        window.location.href = 'payment.html';
    } catch (error) {
        console.error('Error al iniciar sesión con Google:', error);
        alert(`Error: ${error.message}`);
    }
}

// Manejar el clic en el botón de Google
document.getElementById('google-btn').addEventListener('click', signInWithGoogle);
