// assets/js/pedidosSoap.js

const getSoapServiceUrl = function() {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = '3002'; // Puerto del middleware
    
    return `${protocol}//${hostname}:${port}`;
};

const SOAP_SERVICE_URL = getSoapServiceUrl();

// Función auxiliar para realizar solicitudes al middleware SOAP
async function callSoapService(endpoint, method, params = {}) {
    try {
        console.log(`Llamando a ${SOAP_SERVICE_URL}/api/soap/${endpoint}/${method} con parámetros:`, params);
        
        const response = await fetch(`${SOAP_SERVICE_URL}/api/soap/${endpoint}/${method}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error llamando al servicio SOAP (${endpoint}/${method}):`, error);
        throw error;
    }
}

// Obtener todos los pedidos del usuario actual
async function getPedidosUsuario(usuarioId, filtros = {}) {
    try {
        const params = {
            usuarioId: parseInt(usuarioId),
            pagina: filtros.pagina || 1,
            limite: filtros.limite || 10,
            estado: filtros.estado || '',
            fechaDesde: filtros.fechaDesde || '',
            fechaHasta: filtros.fechaHasta || '',
            buscar: filtros.buscar || ''
        };
        
        const result = await callSoapService('pedidos', 'GetPedidosByUsuario', params);
        
        // Procesar resultado para formato consistente
        return procesarResultadoPedidos(result);
    } catch (error) {
        console.error('Error al obtener pedidos del usuario:', error);
        return { 
            pedidos: [], 
            pagination: {
                page: filtros.pagina || 1,
                limit: filtros.limite || 10,
                totalItems: 0,
                totalPages: 0
            }
        };
    }
}

// Obtener un pedido específico por ID
async function getPedidoById(pedidoId) {
    try {
        const result = await callSoapService('pedidos', 'GetPedidoById', { 
            pedidoId: parseInt(pedidoId) 
        });
        
        // Transformar el resultado al formato esperado
        return procesarPedidoIndividual(result.pedido);
    } catch (error) {
        console.error(`Error al obtener pedido #${pedidoId}:`, error);
        return null;
    }
}

// Cancelar un pedido
async function cancelarPedido(pedidoId, motivo) {
    try {
        const result = await callSoapService('pedidos', 'CancelarPedido', {
            pedidoId: parseInt(pedidoId),
            motivo: motivo || 'Cancelado por el cliente'
        });
        
        return {
            success: result.exito,
            message: result.mensaje
        };
    } catch (error) {
        console.error(`Error al cancelar pedido #${pedidoId}:`, error);
        return { 
            success: false, 
            message: error.message 
        };
    }
}

// Confirmar entrega de un pedido
async function confirmarEntrega(pedidoId) {
    try {
        const result = await callSoapService('pedidos', 'ConfirmarEntrega', {
            pedidoId: parseInt(pedidoId)
        });
        
        return {
            success: result.exito,
            message: result.mensaje
        };
    } catch (error) {
        console.error(`Error al confirmar entrega del pedido #${pedidoId}:`, error);
        return { 
            success: false, 
            message: error.message 
        };
    }
}

// Obtener estado de un pedido
async function getEstadoPedido(pedidoId) {
    try {
        const result = await callSoapService('pedidos', 'GetEstadoPedido', {
            pedidoId: parseInt(pedidoId)
        });
        
        return {
            estado: result.estado,
            fecha_actualizacion: result.fechaActualizacion
        };
    } catch (error) {
        console.error(`Error al obtener estado del pedido #${pedidoId}:`, error);
        return { 
            estado: 'desconocido',
            fecha_actualizacion: new Date().toISOString()
        };
    }
}

// Verificar disponibilidad de productos en un pedido
async function verificarDisponibilidad(pedidoId) {
    try {
        const result = await callSoapService('pedidos', 'VerificarDisponibilidad', {
            pedidoId: parseInt(pedidoId)
        });
        
        return {
            disponible: result.disponible,
            items: result.items?.item || []
        };
    } catch (error) {
        console.error(`Error al verificar disponibilidad del pedido #${pedidoId}:`, error);
        return { 
            disponible: false, 
            items: [] 
        };
    }
}

// Obtener historial de seguimiento de un pedido
async function getHistorialSeguimiento(pedidoId) {
    try {
        const result = await callSoapService('pedidos', 'GetHistorialSeguimiento', {
            pedidoId: parseInt(pedidoId)
        });
        
        return {
            eventos: result.eventos?.evento || []
        };
    } catch (error) {
        console.error(`Error al obtener historial de seguimiento del pedido #${pedidoId}:`, error);
        return { 
            eventos: [] 
        };
    }
}

// Función para procesar el resultado de múltiples pedidos
function procesarResultadoPedidos(result) {
    try {
        let pedidos = [];
        
        // Manejar diferentes formatos de respuesta SOAP
        if (result.pedidos) {
            if (Array.isArray(result.pedidos.pedido)) {
                pedidos = result.pedidos.pedido.map(p => procesarPedidoIndividual(p));
            } else if (result.pedidos.pedido) {
                pedidos = [procesarPedidoIndividual(result.pedidos.pedido)];
            }
        }
        
        return {
            pedidos: pedidos,
            pagination: {
                page: parseInt(result.paginacion?.pagina || 1),
                limit: parseInt(result.paginacion?.limite || 10),
                totalItems: parseInt(result.paginacion?.totalItems || 0),
                totalPages: parseInt(result.paginacion?.totalPages || 0)
            }
        };
    } catch (error) {
        console.error('Error al procesar resultados de pedidos:', error);
        return { pedidos: [], pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 } };
    }
}

// Función para procesar un pedido individual
function procesarPedidoIndividual(pedido) {
    if (!pedido) return null;
    
    // Procesar items del pedido
    let items = [];
    if (pedido.items) {
        if (Array.isArray(pedido.items.item)) {
            items = pedido.items.item;
        } else if (pedido.items.item) {
            items = [pedido.items.item];
        }
    }
    
    // Adaptar nomenclatura de campos (camelCase a snake_case)
    const pedidoProcesado = {
        id: parseInt(pedido.id),
        fecha_creacion: pedido.fechaCreacion,
        fecha_pago: pedido.fechaPago,
        fecha_procesamiento: pedido.fechaProcesamiento,
        fecha_envio: pedido.fechaEnvio,
        fecha_entrega: pedido.fechaEntrega,
        fecha_cancelacion: pedido.fechaCancelacion,
        estado: pedido.estado,
        estado_pago: pedido.estadoPago,
        metodo_pago: pedido.metodoPago,
        codigo_autorizacion: pedido.codigoAutorizacion,
        total: parseFloat(pedido.total),
        subtotal: parseFloat(pedido.subtotal),
        envio: parseFloat(pedido.envio || 0),
        descuento: parseFloat(pedido.descuento || 0),
        direccion_envio: pedido.direccionEnvio,
        ciudad: pedido.ciudad,
        metodo_envio: pedido.metodoEnvio,
        numero_seguimiento: pedido.numeroSeguimiento,
        motivo_cancelacion: pedido.motivoCancelacion,
        items: items.map(item => ({
            id: parseInt(item.id),
            producto_id: parseInt(item.productoId),
            nombre: item.nombre,
            codigo: item.codigo,
            precio: parseFloat(item.precio),
            cantidad: parseInt(item.cantidad)
        }))
    };
    
    return pedidoProcesado;
}

// Exportar todas las funciones
window.pedidosSoap = {
    getPedidosUsuario,
    getPedidoById,
    cancelarPedido,
    confirmarEntrega,
    getEstadoPedido,
    verificarDisponibilidad,
    getHistorialSeguimiento,
    callSoapService
};