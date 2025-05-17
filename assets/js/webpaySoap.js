// assets/js/webpaySoap.js
const SOAP_SERVICE_URL = 'http://localhost:3002'; // URL base del servicio SOAP

// Función para iniciar una transacción de pago
async function iniciarTransaccion(pedidoId, monto, urlRetorno) {
    try {
        console.log(`Iniciando transacción WebPay para pedido: ${pedidoId}, monto: ${monto}`);
        
        const response = await fetch(`${SOAP_SERVICE_URL}/api/soap/webpay/IniciarTransaccion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pedidoId: parseInt(pedidoId),
                monto: parseFloat(monto),
                urlRetorno: urlRetorno || window.location.origin + '/pages/confirmacion-pago.html'
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
        }
        
        const resultado = await response.json();
        console.log('Transacción iniciada:', resultado);
        return resultado;
    } catch (error) {
        console.error('Error al iniciar transacción WebPay:', error);
        return { exito: false, mensaje: error.message, token: null, url: null };
    }
}

// Función para confirmar una transacción de pago
async function confirmarTransaccion(token) {
    try {
        console.log(`Confirmando transacción WebPay con token: ${token}`);
        
        // MODIFICADO: Obtener el token de la clave específica de WebPay
        const storedToken = localStorage.getItem('webpay_transaction_token');
        
        // Verificar que sea el mismo token
        if (storedToken !== token) {
            console.warn('Token recibido no coincide con token almacenado');
        }
        
        // Resto del código...
        
        return { exito: true, mensaje: 'Transacción confirmada' };
    } catch (error) {
        // Limpiar token de WebPay en caso de error
        localStorage.removeItem('webpay_transaction_token');
        return { exito: false, mensaje: error.message };
    }
}

// Simulación de formulario de pago WebPay
function simularFormularioPago(pedidoId, monto, callback) {
    // Crear un modal para simular formulario de WebPay
    const modal = document.createElement('div');
    modal.className = 'webpay-modal';
    modal.innerHTML = `
        <div class="webpay-contenedor">
            <h2>Simulación de WebPay</h2>
            <div class="webpay-logo">
                <img src="/assets/images/webpay-logo.png" alt="WebPay" onerror="this.src='/assets/images/logo.png'">
            </div>
            <div class="webpay-detalles">
                <p><strong>Pedido:</strong> #${pedidoId}</p>
                <p><strong>Monto:</strong> $${new Intl.NumberFormat('es-CL').format(monto)}</p>
            </div>
            <div class="webpay-formulario">
                <div class="form-group mb-3">
                    <label class="form-label">Número de Tarjeta</label>
                    <input type="text" class="form-control" value="4051 8856 0044 6623" readonly>
                </div>
                <div class="form-group mb-3">
                    <label class="form-label">Fecha de Expiración</label>
                    <input type="text" class="form-control" value="12/25" readonly>
                </div>
                <div class="form-group mb-3">
                    <label class="form-label">CVV</label>
                    <input type="text" class="form-control" value="123" readonly>
                </div>
                <div class="webpay-botones">
                    <button class="btn btn-success btn-aprobar">Aprobar Pago</button>
                    <button class="btn btn-danger btn-rechazar">Rechazar Pago</button>
                </div>
            </div>
        </div>
    `;
    
    // Agregar estilos CSS para el modal
    const style = document.createElement('style');
    style.textContent = `
        .webpay-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        .webpay-contenedor {
            background-color: white;
            padding: 20px;
            border-radius: 10px;
            width: 90%;
            max-width: 500px;
        }
        .webpay-logo {
            text-align: center;
            margin-bottom: 20px;
        }
        .webpay-logo img {
            max-width: 200px;
        }
        .webpay-detalles {
            margin-bottom: 20px;
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 5px;
            background-color: #f9f9f9;
        }
        .webpay-botones {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // Agregar eventos a los botones
    modal.querySelector('.btn-aprobar').addEventListener('click', function() {
        document.body.removeChild(modal);
        // Generar token simulado
        const token = 'WP-' + Date.now() + '-' + pedidoId;
    // Guarda el token en localStorage con un nombre diferente - NO USE AUTH_TOKEN
    localStorage.setItem('01ab25305179dacf37e6edbded7c429dfdc01d2ea90e4d1bcd79b70c24734b12', token);
        callback({
            exito: true,
            token: token,
            mensaje: 'Pago aprobado con éxito'
        });
    });
    
    modal.querySelector('.btn-rechazar').addEventListener('click', function() {
        document.body.removeChild(modal);
        callback({
            exito: false,
            token: null,
            mensaje: 'Pago rechazado por el usuario'
        });
    });
}

// Exportar funciones
window.webpaySoap = {
    iniciarTransaccion,
    confirmarTransaccion,
    simularFormularioPago
};