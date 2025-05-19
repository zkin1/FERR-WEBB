(function() {
    // Configuración del cliente SOAP
    const SOAP_ENDPOINT = 'http://localhost:8004/ws-pedido';
    const SOAP_NAMESPACE = 'http://ferremas.cl/ws-pedido';

    console.log('🔌 Inicializando PedidoAPI:');
    console.log('  - Endpoint:', SOAP_ENDPOINT);
    console.log('  - Namespace:', SOAP_NAMESPACE);

    // Función para crear el XML de la solicitud SOAP
    const createSoapEnvelope = (operation, params) => {
        let paramsXml = '';
        
        for (const key in params) {
            if (key === 'detalles') {
                paramsXml += `<tns:detalles>`;
                for (const detalle of params.detalles) {
                    paramsXml += `<tns:detalle>
                        <tns:producto_id>${detalle.producto_id}</tns:producto_id>
                        <tns:nombre_producto>${detalle.nombre_producto}</tns:nombre_producto>
                        <tns:cantidad>${detalle.cantidad}</tns:cantidad>
                        <tns:precio_unitario>${detalle.precio_unitario}</tns:precio_unitario>
                    </tns:detalle>`;
                }
                paramsXml += `</tns:detalles>`;
            } else {
                paramsXml += `<tns:${key}>${params[key]}</tns:${key}>`;
            }
        }
        
        return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="${SOAP_NAMESPACE}">
  <soap:Body>
    <tns:${operation}Request>
      ${paramsXml}
    </tns:${operation}Request>
  </soap:Body>
</soap:Envelope>`;
    };

    // Función para analizar la respuesta XML y convertirla a JSON
    const parseSoapResponse = async (response) => {
        const text = await response.text();
        console.log(`[PedidoAPI] Respuesta XML recibida:`, text.slice(0, 500) + '...');
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        
        // Extraer el resultado basado en la estructura de la respuesta
        const result = {};
        const responseNode = xmlDoc.getElementsByTagNameNS(SOAP_NAMESPACE, "*")[1]; // Obtener nodo de respuesta
        
        if (!responseNode) {
            console.error('No se pudo encontrar el nodo de respuesta en la respuesta SOAP');
            return { exito: false, mensaje: 'Error al procesar la respuesta del servidor' };
        }
        
        for (const node of responseNode.childNodes) {
            if (node.nodeType === 1) { // Solo nodos de elementos
                const key = node.localName;
                
                // Manejar casos especiales
                if (key === 'pedido' || key === 'pedidos') {
                    try {
                        result[key] = JSON.parse(node.textContent);
                    } catch (e) {
                        console.warn('Error al parsear JSON del campo', key, e);
                        result[key] = node.textContent;
                    }
                } else if (key === 'exito') {
                    result[key] = node.textContent === 'true';
                } else {
                    result[key] = node.textContent;
                }
            }
        }
        
        console.log(`[PedidoAPI] Respuesta procesada:`, result);
        return result;
    };

    

    // Función para enviar solicitud SOAP
    const sendSoapRequest = async (operation, params) => {
        console.log(`[PedidoAPI] Enviando solicitud ${operation}:`, params);
        
        const envelope = createSoapEnvelope(operation, params);
        console.log(`[PedidoAPI] Envelope XML generado:`, envelope.slice(0, 500) + '...');
        
        try {
            const startTime = Date.now();
            
            const response = await fetch(SOAP_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'SOAPAction': `${SOAP_NAMESPACE}/${operation}`
                },
                body: envelope
            });
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            console.log(`[PedidoAPI] Respuesta recibida en ${responseTime}ms`);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const result = await parseSoapResponse(response);
            
            // Disparar evento personalizado para notificar que se recibió una respuesta
            const event = new CustomEvent('pedidoapi:response', { 
                detail: { operation, result, responseTime } 
            });
            document.dispatchEvent(event);
            
            return result;
        } catch (error) {
            console.error(`[PedidoAPI] Error en operación ${operation}:`, error);
            
            // Disparar evento de error
            const event = new CustomEvent('pedidoapi:error', { 
                detail: { operation, error: error.message } 
            });
            document.dispatchEvent(event);
            
            throw error;
        }
    };

    // API de pedidos
    window.PedidoAPI = {
        // Crear un nuevo pedido
        crearPedido: async (datosPedido) => {
            return sendSoapRequest('CrearPedido', datosPedido);
        },
        
        // Consultar un pedido por ID o número
        consultarPedido: async (id, numeroPedido) => {
            const params = {};
            if (id) params.id = id;
            if (numeroPedido) params.numeroPedido = numeroPedido;
            
            return sendSoapRequest('ConsultarPedido', params);
        },
        
        // Actualizar el estado de un pedido
        actualizarEstadoPedido: async (id, nuevoEstado, comentario = '') => {
            return sendSoapRequest('ActualizarEstadoPedido', {
                id,
                nuevoEstado,
                comentario
            });
        },
        
        // Consultar pedidos por usuario
        consultarPedidosPorUsuario: async (usuarioId) => {
            return sendSoapRequest('ConsultarPedidosPorUsuario', { usuarioId });
        },
        
        // Consultar pedidos por estado
        consultarPedidosPorEstado: async (estado) => {
            return sendSoapRequest('ConsultarPedidosPorEstado', { estado });
        },
        
        // Prueba de conexión con el servidor
        testConnection: async () => {
            try {
                // Intentamos consultar un pedido con un ID improbable
                const startTime = Date.now();
                const result = await sendSoapRequest('ConsultarPedido', { id: 999999 });
                const responseTime = Date.now() - startTime;
                
                return {
                    success: true,
                    responseTime,
                    result
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        }
    };
    
    console.log('✅ PedidoAPI inicializada correctamente');
})();