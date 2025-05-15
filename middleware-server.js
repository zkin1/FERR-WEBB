
const express = require('express');
const soap = require('soap');
const cors = require('cors');

// Crear aplicación Express
const app = express();
const PORT = 3002; // Middleware en puerto 3002

// Configurar CORS
app.use(cors());
app.use(express.json());

// Endpoint de salud
app.get('/api/health', (req, res) => {
    res.json({ status: 'UP', message: 'Middleware funcionando correctamente' });
});

// URLs de los servicios SOAP
const SOAP_SERVICES = {
    stock: 'http://localhost:3001/wsdl/stock?wsdl',
    ubicaciones: 'http://localhost:3001/wsdl/ubicaciones?wsdl',
    movimientos: 'http://localhost:3001/wsdl/movimientos?wsdl',
    ajustes: 'http://localhost:3001/wsdl/ajustes?wsdl'
};

// Almacenar clientes SOAP
const soapClients = {};

// Inicializar clientes SOAP
async function initSoapClients() {
    try {
        for (const [key, url] of Object.entries(SOAP_SERVICES)) {
            console.log(`Conectando a servicio SOAP: ${key} en ${url}`);
            try {
                soapClients[key] = await soap.createClientAsync(url);
                console.log(`✅ Cliente SOAP inicializado para ${key}`);
            } catch (error) {
                console.error(`❌ Error al crear cliente SOAP para ${key}:`, error.message);
            }
        }
    } catch (error) {
        console.error('Error al inicializar clientes SOAP:', error);
    }
}

// Ruta para llamar a los servicios SOAP
app.post('/api/soap/:service/:method', async (req, res) => {
    const { service, method } = req.params;
    const params = req.body;
    
    console.log(`📥 Recibida solicitud: ${service}.${method}`, params);
    
    try {
        // Verificar si el servicio existe
        if (!soapClients[service]) {
            // Intentar reconectar
            try {
                soapClients[service] = await soap.createClientAsync(SOAP_SERVICES[service]);
                console.log(`Cliente SOAP reconectado para ${service}`);
            } catch (err) {
                return res.status(503).json({
                    error: `Servicio SOAP '${service}' no disponible`,
                    details: err.message
                });
            }
        }
        
        const client = soapClients[service];
        
        // Verificar si el método existe
        if (!client[method]) {
            return res.status(404).json({
                error: `Método '${method}' no encontrado en el servicio '${service}'`
            });
        }
        
        // Llamar al método SOAP
        console.log(`🔄 Llamando a SOAP: ${method}`, params);
        const result = await client[method + 'Async'](params);
        
        // Devolver resultado
        console.log(`📤 Respuesta SOAP para ${service}.${method}`);
        res.json(result[0]);
    } catch (error) {
        console.error(`❌ Error en llamada SOAP ${service}.${method}:`, error);
        res.status(500).json({
            error: 'Error al llamar al servicio SOAP',
            details: error.message
        });
    }
});


async function callSoapService(endpoint, method, params = {}) {
    try {
        // Usar la función helper de APP_CONFIG
        const soapUrl = window.APP_CONFIG ? 
            window.APP_CONFIG.getSoapUrl(endpoint, method) : 
            '/proxy.php?target=soap&path=' + encodeURIComponent(endpoint + '/' + method);
            
        console.log(`Llamando a ${soapUrl} con parámetros:`, params);
        
        const response = await fetch(soapUrl, {
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

// Iniciar el servidor y los clientes SOAP
app.listen(PORT, async () => {
    console.log(`🚀 Middleware iniciado en http://localhost:${PORT}`);
    await initSoapClients();
});