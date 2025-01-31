import { auth } from "./firebase-config.js"; // Importa la configuración de Firebase


// Configuración del cronómetro
function initializeCountdown(targetDate) {
    const daysElement = document.getElementById("days");
    const hoursElement = document.getElementById("hours");
    const minutesElement = document.getElementById("minutes");
    const secondsElement = document.getElementById("seconds");

    if (!daysElement || !hoursElement || !minutesElement || !secondsElement) {
        console.error("Error: No se encontraron los elementos del cronómetro en el DOM.");
        return;
    }

    function updateCountdown() {
        const now = new Date().getTime();
        const timeLeft = targetDate - now;

        if (timeLeft <= 0) {
            clearInterval(interval);
            daysElement.textContent = "0";
            hoursElement.textContent = "00";
            minutesElement.textContent = "00";
            secondsElement.textContent = "00";
            alert("El tiempo para participar ha finalizado.");
            return;
        }

        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        daysElement.textContent = days;
        hoursElement.textContent = hours.toString().padStart(2, '0');
        minutesElement.textContent = minutes.toString().padStart(2, '0');
        secondsElement.textContent = seconds.toString().padStart(2, '0');
    }

    const interval = setInterval(updateCountdown, 1000);
    updateCountdown();
}

// Guardar la fecha de finalización en localStorage si no existe
let endDate = localStorage.getItem("endDate");

if (!endDate) {
    const now = new Date();
    now.setDate(now.getDate() + 2); // Agregar 2 días
    endDate = now.getTime();
    localStorage.setItem("endDate", endDate);
} else {
    endDate = parseInt(endDate, 10); // Convertir de string a número
}

// Inicializar el cronómetro con la fecha guardada
initializeCountdown(endDate);



// Generar una referencia única para la transacción
function generateUniqueReference() {
    const timestamp = Date.now(); // Marca de tiempo
    const randomPart = Math.random().toString(36).substring(2, 10); // Parte aleatoria
    return `txn_${timestamp}_${randomPart}`;
}

// Escuchar el evento del botón de pago
document.getElementById('pay-button').addEventListener('click', async () => {
    try {
        // Obtén el correo electrónico del usuario autenticado
        const user = auth.currentUser;
        if (!user) {
            throw new Error("No hay un usuario autenticado.");
        }
        const email = user.email; // Correo del usuario autenticado

        // Configurar los datos de la transacción
        const reference = generateUniqueReference(); // Referencia única
        const amountInCents = 150000; // Monto en centavos
        const currency = 'COP'; // Moneda
        const expirationTime = new Date(Date.now() + 600 * 1000).toISOString().split('.')[0] + 'Z'; // Tiempo de expiración en ISO 8601

        

        // Solicitar el hash al backend
        const response = await fetch('http://localhost:3000/generate-hash', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference, amountInCents, currency, expirationTime }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error del backend: ${errorText}`);
        }

        const { hash } = await response.json();
        console.log('Hash recibido del backend:', hash);

        // Configurar el widget de Wompi
        const checkout = new WidgetCheckout({
            currency,
            amountInCents,
            reference,
            publicKey: 'pub_test_74VgAe3KMnW5CupD6E77o4Ccro6IVOvd', // Clave pública de pruebas
            redirectUrl:  'http://localhost:3000/respuesta-pago', // URL de redirección
            customerData: {
                email: email, // Correo del usuario autenticado
            },
            expirationTime, // Tiempo de expiración
            signature: {
                integrity: hash, // Hash recibido del backend
            },
        });

        // Abrir el widget
        checkout.open((result) => {
            const { transaction } = result;
            if (transaction && transaction.status === 'APPROVED') {
                alert('Pago aprobado. ¡Gracias por tu compra!');
            } else {
                alert(`El pago no fue aprobado: ${transaction.status}`);
            }
        });
    } catch (error) {
        console.error('Error al procesar el pago:', error);
        alert('Hubo un error al procesar el pago. Inténtalo nuevamente.');
    }
});

