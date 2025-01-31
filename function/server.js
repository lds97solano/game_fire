const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const crypto = require('crypto');



// Inicializar Firebase Admin SDK
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://game-fire-b7731-default-rtdb.firebaseio.com/",
});

const db = admin.database();
const app = express();
const WOMPI_API_URL = 'https://sandbox.wompi.co/v1/transactions'; // Cambiar a producción cuando lances
const API_KEY = 'prv_test_Ciwajf8HDLp05V4SE3Oz4S09iKQRacb8'; // Clave privada desde la consola de Wompi

app.get('/home', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});


// Middleware
app.use(cors());
app.use(bodyParser.json());

const authenticateUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token de autenticación faltante.' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.userId = decodedToken.uid; // Asigna el UID al objeto req
        next();
    } catch (error) {
        console.error('Error al verificar el token:', error);
        res.status(401).json({ error: 'Token inválido.' });
    }
};


// Endpoint para registrar usuarios con correo y contraseña
app.post('/register', async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    try {
        const user = await admin.auth().createUser({ email, password, displayName: name });
        await db.ref(`users/${user.uid}`).set({ email, name, createdAt: Date.now() });

        res.status(200).json({ message: 'Usuario registrado exitosamente.' });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para registrar usuarios con Google
app.post('/register-google', async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        console.error("Token de Google faltante.");
        return res.status(400).json({ error: 'Token de Google faltante.' });
    }

    try {
        console.log("Token recibido en el backend:", idToken);

        // Verificar el token con Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        console.log("Token verificado:", decodedToken);

        const uid = decodedToken.uid;
        const email = decodedToken.email;
        const name = decodedToken.name;

        // Verificar si el usuario ya existe
        const userRef = db.ref(`users/${uid}`);
        const snapshot = await userRef.once('value');

        if (snapshot.exists()) {
            console.log("Usuario ya registrado en la base de datos.");
            return res.status(200).json({ message: 'Usuario ya registrado.' });
        }

        // Guardar los datos del usuario en la base de datos
        await userRef.set({ email, name, createdAt: Date.now() });
        console.log("Usuario registrado exitosamente.");
        res.status(200).json({ message: 'Usuario registrado exitosamente.' });
    } catch (error) {
        console.error("Error al procesar el token de Google:", error);
        res.status(500).json({ error: 'Error al procesar el token de Google.' });
    }
});

const helmet = require('helmet');

app.use(
    helmet({
        crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    })
);



// Endpoint para iniciar sesión con correo y contraseña
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
    }

    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        const customToken = await admin.auth().createCustomToken(userRecord.uid);

        res.status(200).json({ token: customToken });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Error al iniciar sesión.' });
    }
});

// Endpoint para iniciar sesión con Google
app.post('/login-google', async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ error: 'Token de Google faltante.' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const customToken = await admin.auth().createCustomToken(uid);
        res.status(200).json({ token: customToken });
    } catch (error) {
        console.error('Error al iniciar sesión con Google:', error);
        res.status(500).json({ error: 'Error al procesar el inicio de sesión con Google.' });
    }
});
// Endpoint para actualizar el puntaje
app.post('/update-score', authenticateUser, async (req, res) => {
    const userId = req.userId; // Ahora debe estar definido
    const { score } = req.body;

    console.log('UID en el endpoint:', userId);

    if (!score && score !== 0) {
        return res.status(400).json({ error: 'Puntaje es obligatorio.' });
    }

    try {
        const userRef = db.ref(`scores/${userId}`);
        const snapshot = await userRef.once('value');
        const currentScore = snapshot.val()?.score || 0;

        if (score > currentScore) {
            await userRef.set({
                score,
                timestamp: Date.now(),
            });
            return res.status(200).json({ message: 'Puntaje actualizado exitosamente.' });
        } else {
            return res.status(200).json({ message: 'El puntaje no es mayor al registrado.' });
        }
    } catch (error) {
        console.error('Error al actualizar el puntaje:', error);
        res.status(500).json({ error: 'Error al actualizar el puntaje.' });
    }
});


// Otros endpoints (ejemplo para obtener los puntajes de todos los usuarios)
app.get('/get-scores', async (req, res) => {
    try {
        const scoresRef = db.ref('scores');
        const snapshot = await scoresRef.once('value');
        const scores = snapshot.val();
        res.status(200).json(scores);
    } catch (error) {
        console.error('Error al obtener los puntajes:', error);
        res.status(500).json({ error: 'Error al obtener los puntajes.' });
    }
});

// Endpoint para obtener los 5 puntajes más altos
app.get('/top-scores', async (req, res) => {
    try {
        const scoresRef = db.ref('scores');
        const snapshot = await scoresRef.orderByChild('score').limitToLast(5).once('value');
        const scores = [];

        snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            scores.unshift({ name: data.name || 'Anónimo', score: data.score });
        });

        // Ordenar los puntajes en orden descendente
        scores.sort((a, b) => b.score - a.score);

        res.status(200).json(scores);
    } catch (error) {
        console.error('Error al obtener los puntajes:', error);
        res.status(500).json({ error: 'Error al obtener los puntajes.' });
    }
});

// Endpoint para obtener el puntaje del jugador actual
app.get('/user-score/:uid', async (req, res) => {
    const { uid } = req.params;

    if (!uid) {
        return res.status(400).json({ error: 'UID del usuario es obligatorio.' });
    }

    try {
        const userRef = db.ref(`scores/${uid}`);
        const snapshot = await userRef.once('value');

        if (!snapshot.exists()) {
            return res.status(404).json({ error: 'El usuario no tiene un puntaje registrado.' });
        }

        res.status(200).json(snapshot.val());
    } catch (error) {
        console.error('Error al obtener el puntaje del usuario:', error);
        res.status(500).json({ error: 'Error al obtener el puntaje del usuario.' });
    }
});
// Clave de integridad para el entorno de pruebas o producción
const integritySecret = 'test_integrity_yKKvPAZW3GvhFd7bFP5vhgpATKPB0p1O'; // Reemplazar por prod_integrity en producción

app.post('/generate-hash', (req, res) => {
    try {
        const { reference, amountInCents, currency, expirationTime } = req.body;

        // Validación de parámetros
        if (!reference || !amountInCents || !currency || !expirationTime) {
            return res.status(400).json({
                error: 'Faltan parámetros para generar el hash',
                received: { reference, amountInCents, currency, expirationTime },
            });
        }

        // Concatenar cadena para hash
        const stringToHash = `${reference}${amountInCents}${currency}${expirationTime}${integritySecret}`;
        console.log("Cadena para hash:", stringToHash);

        // Generar el hash
        const hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
        console.log("Hash generado:", hash);

        // Responder con el hash
        res.status(200).json({ hash });
    } catch (error) {
        console.error("Error al generar el hash:", error);
        res.status(500).json({ error: 'Error interno al generar el hash.' });
    }
});

app.get('/respuesta-pago', async (req, res) => {
    const transactionId = req.query.id;
    console.log('ID de transacción recibido:', transactionId);

    if (!transactionId) {
        console.error('No se recibió el ID de transacción.');
        return res.status(400).send('ID de transacción no encontrado.');
    }

    try {
        const response = await fetch(`https://sandbox.wompi.co/v1/transactions/${transactionId}`, {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
            },
        });

        if (!response.ok) {
            console.error('Error en la consulta a Wompi:', await response.text());
            throw new Error('Error al consultar la transacción.');
        }

        const transactionData = await response.json();
        console.log('Datos de la transacción:', transactionData);

        if (transactionData.data.status === 'APPROVED') {
            console.log('Pago aprobado. Redirigiendo a game.html...');
            return res.redirect('/game.html');
        } else {
            console.log('Estado del pago:', transactionData.data.status);
            return res.send(`
                <h1>Estado del Pago: ${transactionData.data.status}</h1>
                <p>Por favor, intenta nuevamente o contacta soporte si hay algún problema.</p>
            `);
        }
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return res.status(500).send('Hubo un error al procesar tu solicitud.');
    }
});

// endpoint respuesta de pago 
app.get('/respuesta-pago', async (req, res) => {
    const transactionId = req.query.id;

    if (!transactionId) {
        console.error('No se recibió el ID de transacción.');
        return res.status(400).send('ID de transacción no encontrado.');
    }

    try {
        const response = await fetch(`https://sandbox.wompi.co/v1/transactions/${transactionId}`, {
            headers: {
                Authorization: `Bearer ${API_KEY}`, // Usa tu clave privada
            },
        });

        if (!response.ok) {
            console.error('Error en la consulta a Wompi:', await response.text());
            throw new Error('Error al consultar la transacción.');
        }

        const transactionData = await response.json();

        if (transactionData.data.status === 'APPROVED') {
            const userId = transactionData.data.customer_data.email; // Obtén el ID del usuario
            // Actualiza el estado de pago en la base de datos
            const userRef = db.ref(`users/${userId}`);
            await userRef.update({ hasPaid: true });

            console.log('Pago registrado exitosamente. Redirigiendo a game.html...');
            return res.redirect('/game.html'); // Redirigir al juego
        } else {
            console.log(`Estado del pago: ${transactionData.data.status}`);
            return res.send(`
                <h1>Estado del Pago: ${transactionData.data.status}</h1>
                <p>Por favor, intenta nuevamente o contacta soporte si hay algún problema.</p>
            `);
        }
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return res.status(500).send('Hubo un error al procesar tu solicitud.');
    }
});


// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
