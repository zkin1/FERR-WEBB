// assets/js/inventarioSoap.js
const SOAP_SERVICE_URL = 'http://localhost:3002'; // URL base del servicio SOAP

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

// FUNCIONES DE STOCK
async function getProductStock(productoId) {
    try {
        const result = await callSoapService('stock', 'GetStockByProducto', { productoId });
        return result;
    } catch (error) {
        console.error('Error al obtener stock del producto:', error);
        return { stockItems: { stockItem: [] } }; // Devolver estructura vacía por defecto
    }
}

async function getStockByLocation(ubicacionId, page = 1, limit = 10) {
    try {
        const result = await callSoapService('stock', 'GetStockByUbicacion', { 
            ubicacionId, 
            page, 
            limit 
        });
        return result;
    } catch (error) {
        console.error('Error al obtener stock por ubicación:', error);
        return { stockItems: { stockItem: [] } };
    }
}

async function getLowStockProducts(page = 1, limit = 10) {
    try {
        const result = await callSoapService('stock', 'GetStockBajoMinimo', { page, limit });
        return result;
    } catch (error) {
        console.error('Error al obtener productos con stock bajo:', error);
        return { stockItems: { stockItem: [] } };
    }
}

async function updateStockMinMax(stockId, stockMinimo, stockMaximo) {
    try {
        console.log('Actualizando stock min/max:', stockId, stockMinimo, stockMaximo);
        
        // Usar los nombres de parámetros correctos para el servicio SOAP
        const payload = { 
            id: parseInt(stockId), 
            stockMinimo: parseInt(stockMinimo), 
            stockMaximo: parseInt(stockMaximo) 
        };
        
        const result = await callSoapService('stock', 'ActualizarStockMinMax', payload);
        console.log('Resultado de actualización:', result);
        return result;
    } catch (error) {
        console.error('Error al actualizar stock mínimo y máximo:', error);
        throw error;
    }
}

async function getAllStock(page = 1, limit = 10) {
    try {
        const result = await callSoapService('stock', 'GetAllStock', { page, limit });
        return result;
    } catch (error) {
        console.error('Error al obtener todo el stock:', error);
        return { stockItems: { stockItem: [] } };
    }
}

// FUNCIONES DE UBICACIONES
async function getAllLocations() {
    try {
        const result = await callSoapService('ubicaciones', 'GetAllUbicaciones', {});
        return result;
    } catch (error) {
        console.error('Error al obtener ubicaciones:', error);
        return { ubicaciones: { ubicacion: [] } };
    }
}

async function getLocationById(id) {
    try {
        const result = await callSoapService('ubicaciones', 'GetUbicacionById', { id });
        return result;
    } catch (error) {
        console.error(`Error al obtener ubicación ${id}:`, error);
        return null;
    }
}

// FUNCIONES DE MOVIMIENTOS
async function registerMovement(movimiento) {
    try {
        // Convertir los nombres de las propiedades al formato esperado por el servicio SOAP
        const movimientoFormateado = {
            productoId: parseInt(movimiento.producto_id),
            origenId: movimiento.origen_id ? parseInt(movimiento.origen_id) : null,
            destinoId: movimiento.destino_id ? parseInt(movimiento.destino_id) : null,
            cantidad: parseInt(movimiento.cantidad),
            tipoId: parseInt(movimiento.tipo_id),
            referencia: movimiento.referencia || '',
            notas: movimiento.notas || ''
        };
        
        console.log('Enviando movimiento formateado:', movimientoFormateado);
        
        const result = await callSoapService('movimientos', 'RegistrarMovimiento', movimientoFormateado);
        return result;
    } catch (error) {
        console.error('Error al registrar movimiento:', error);
        throw error;
    }
}

async function getMovementsByProduct(productoId, page = 1, limit = 10) {
    try {
        const result = await callSoapService('movimientos', 'GetMovimientosByProducto', { 
            productoId: parseInt(productoId), 
            page, 
            limit 
        });
        return result;
    } catch (error) {
        console.error('Error al obtener movimientos del producto:', error);
        return { movimientos: { movimiento: [] } };
    }
}

async function getMovementTypes() {
    try {
        const result = await callSoapService('movimientos', 'GetTiposMovimiento', {});
        return result;
    } catch (error) {
        console.error('Error al obtener tipos de movimiento:', error);
        return { tiposMovimiento: { tipoMovimiento: [] } };
    }
}

// FUNCIONES DE AJUSTES
async function registerAdjustment(ajuste) {
    try {
        // Crear la estructura exacta que espera el servicio SOAP
        const payload = {
            ajuste: {
                productoId: parseInt(ajuste.producto_id),
                ubicacionId: parseInt(ajuste.ubicacion_id),
                cantidadNueva: parseInt(ajuste.cantidad_nueva),
                motivoAjuste: ajuste.motivo,  // <-- El nombre correcto es motivoAjuste, no motivo
                descripcion: ajuste.descripcion || ''
                // cantidadAnterior no se necesita, el servicio lo obtiene de la BD
            }
        };
        
        console.log('Enviando ajuste con la estructura correcta:', payload);
        
        // Llamada al servicio SOAP
        const result = await callSoapService('ajustes', 'RegistrarAjuste', payload);
        
        console.log('Respuesta de registro de ajuste:', result);
        return result;
    } catch (error) {
        console.error('Error al registrar ajuste:', error);
        throw error;
    }
}

// Exportar todas las funciones
window.inventarioSoap = {
    getProductStock,
    getStockByLocation,
    getLowStockProducts,
    updateStockMinMax,
    getAllLocations,
    getLocationById,
    registerMovement,
    getMovementsByProduct,
    getMovementTypes,
    registerAdjustment,
    getAllStock,
    callSoapService
};