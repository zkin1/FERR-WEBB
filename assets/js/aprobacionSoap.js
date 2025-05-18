// assets/js/aprobacionSoap.js
const getSoapServiceUrl = function() {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = '3002'; // Puerto del middleware
    
    return `${protocol}//${hostname}:${port}`;
};

const SOAP_SERVICE_URL = getSoapServiceUrl();

// Función para verificar si un pedido puede ser aprobado
async function verificarAprobacion(pedidoId) {
    try {
        console.log(`Verificando aprobación del pedido: ${pedidoId}`);
        
        const response = await fetch(`${SOAP_SERVICE_URL}/api/soap/aprobacion/VerificarAprobacion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pedidoId: parseInt(pedidoId) })
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
        }
        
        const resultado = await response.json();
        console.log('Resultado de verificación:', resultado);
        return resultado;
    } catch (error) {
        console.error('Error al verificar aprobación:', error);
        return { aprobado: false, mensaje: error.message };
    }
}

// Función para aprobar un pedido
async function aprobarPedido(pedidoId) {
    try {
        console.log(`Aprobando pedido: ${pedidoId}`);
        
        const response = await fetch(`${SOAP_SERVICE_URL}/api/soap/aprobacion/AprobarPedido`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pedidoId: parseInt(pedidoId) })
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
        }
        
        const resultado = await response.json();
        console.log('Resultado de aprobación:', resultado);
        return resultado;
    } catch (error) {
        console.error('Error al aprobar pedido:', error);
        return { exito: false, mensaje: error.message, numeroAprobacion: '' };
    }
}

// Exportar funciones
window.aprobacionSoap = {
    verificarAprobacion,
    aprobarPedido
};