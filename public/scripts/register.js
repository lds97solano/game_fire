import { auth, GoogleAuthProvider, signInWithPopup } from "./firebase-config.js";

// Función para registrar un usuario con correo y contraseña a través del backend
async function registerWithEmail(email, password, name) {
    try {
        const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, name }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }

        console.log('Usuario registrado exitosamente.');
        alert('Registro exitoso. Redirigiendo al inicio de sesión...');
        window.location.href = 'login.html'; // Redirige al inicio de sesión
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        alert(`Error al registrar usuario: ${error.message}`);
    }
}

// Manejar el formulario de registro
document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const name = document.getElementById('register-name').value;
    registerWithEmail(email, password, name);
});

// Función para registrar un usuario con Google
async function registerWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        console.log("Intentando registrar con Google...");
        
        // Autenticar al usuario con Firebase Authentication
        const result = await signInWithPopup(auth, provider);
        const idToken = await result.user.getIdToken();

        console.log("Token de ID de Google obtenido:", idToken);

        // Enviar el token de Google al backend para registrar al usuario
        const response = await fetch('http://localhost:3000/register-google', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
        });

        console.log("Token enviado al backend:", idToken);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }

        console.log('Registro con Google exitoso.');
        alert('Registro exitoso. Redirigiendo al inicio de sesión...');
        window.location.href = 'login.html'; // Redirige al inicio de sesión
    } catch (error) {
        console.error('Error al registrar con Google:', error);
        alert(`Error: ${error.message}`);
    }
}

// Manejar el clic en el botón de Google
document.getElementById('google-btn').addEventListener('click', registerWithGoogle);
