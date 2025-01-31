// Importar módulos necesarios de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBdUpHlTavwxRE9k8spbsyCOFrpfVgYfpQ",
    authDomain: "game-fire-b7731.firebaseapp.com",
    databaseURL: "https://game-fire-b7731-default-rtdb.firebaseio.com",
    projectId: "game-fire-b7731",
    storageBucket: "game-fire-b7731.appspot.com",
    messagingSenderId: "119100872825",
    appId: "1:119100872825:web:ae78299a946ecc71a5dca8",
    measurementId: "G-Q6NV2J40CE"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios de Firebase
const auth = getAuth(app);
const database = getDatabase(app);

// Configurar persistencia de sesión
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log("Persistencia de sesión configurada correctamente.");
    })
    .catch((error) => {
        console.error("Error al configurar la persistencia de sesión:", error);
    });

// Exportar servicios y funciones necesarios
export { auth, GoogleAuthProvider, signInWithPopup, database, ref, set, onValue };
