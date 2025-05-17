const express = require('express');
const soap = require('soap');
const cors = require('cors');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const fetch = require('node-fetch');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3002; // Middleware en puerto 3002

// Middleware para registrar el tiempo de inicio de la solicitud
app.use((req, res, next) => {
    if (req.url.includes('/api/')) {
        console.log(`[${new Date().toISOString()}] 📝 Recibida solicitud: ${req.method} ${req.url}`);
    }
    next();
});
// Configurar CORS
app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Agregar middleware para cookies

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'pages')));

// Middleware para proteger rutas admin
const protegerRutaAdmin = (req, res, next) => {
  // Obtener token de cookie o encabezado
  const token = req.cookies?.authToken || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.redirect('/login.html?redirect=' + encodeURIComponent(req.originalUrl));
  }
  
  try {
    // Verificar token usando la misma clave secreta que en tu API
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar si es admin
    if (decoded.rol !== 'admin') {
      return res.status(403).sendFile(path.join(__dirname, 'pages', 'acceso-denegado.html'));
    }
    
    // Agregar info del usuario al request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error verificando token:', error);
    res.redirect('/login.html?redirect=' + encodeURIComponent(req.originalUrl));
  }
};

// Aplicar el middleware a rutas admin - CORRECCIÓN AQUÍ
app.use('/admin', protegerRutaAdmin);

// Configurar proxy para la API de usuarios
app.use('/api/usuarios', createProxyMiddleware({
    target: 'http://localhost:3003',
    changeOrigin: true,
    pathRewrite: {
        '^/api/usuarios': '/api/usuarios' // Mantiene la ruta original
    },
    onError: (err, req, res) => {
        console.error('Error en proxy API Usuarios:', err);
        res.status(503).json({ message: 'Servicio no disponible', error: err.message });
    }
}));

// Configurar proxy para la API de autenticación
app.use('/api/auth', createProxyMiddleware({
    target: 'http://localhost:3003',
    changeOrigin: true,
    pathRewrite: {
        '^/api/auth': '/api/auth' // Mantiene la ruta original
    },
    logLevel: 'debug', // Añadir logging más detallado
    onError: (err, req, res) => {
        console.error('🚨 Error en proxy API Auth:', err);
        res.status(503).json({ 
            error: true, 
            message: 'Servicio de autenticación no disponible',
            details: err.message
        });
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🔄 Proxy redireccionando ${req.method} ${req.path} a ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`);
        
        // Si hay body, registrarlo
        if (req.body && Object.keys(req.body).length > 0) {
            console.log('   Body:', JSON.stringify(req.body).substring(0, 200) + '...');
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`✅ Proxy respuesta ${proxyRes.statusCode} de ${req.method} ${req.path}`);
    }
}));

// Configurar proxy para la API de direcciones
app.use('/api/direcciones', createProxyMiddleware({
    target: 'http://localhost:3003',
    changeOrigin: true,
    pathRewrite: {
        '^/api/direcciones': '/api/direcciones' // Mantiene la ruta original
    },
    onError: (err, req, res) => {
        console.error('Error en proxy API Direcciones:', err);
        res.status(503).json({ message: 'Servicio no disponible', error: err.message });
    }
}));

// El resto del código permanece igual...

// Endpoint para verificar la API de usuarios
app.get('/api/health', async (req, res) => {
    try {
        // CORRECCIÓN: Cambiar la URL al endpoint raíz correcto
        const response = await fetch('http://localhost:3003/');
        
        if (response.ok) {
            const data = await response.json();
            // Agregar el tiempo de respuesta como header
            res.setHeader('X-Response-Time', `${Date.now() - req.startTime}ms`);
            
            // Devolver la respuesta de la API
            res.json(data);
        } else {
            // Si hay error en la API, devolver un error
            let errorData = { message: 'Error en la API de usuarios' };
            try {
                errorData = await response.json();
            } catch (e) {
                console.error('Error al parsear respuesta:', e);
            }
            
            res.status(response.status).json({
                status: 'ERROR',
                message: errorData.message || 'Error en la API de usuarios',
            });
        }
    } catch (error) {
        console.error('Error al conectar con API de usuarios:', error);
        // Si hay error de conexión, devolver error 503
        res.status(503).json({
            status: 'DOWN',
            message: `No se pudo conectar con la API de usuarios: ${error.message}`,
            error: error.message
        });
    }
});

// Endpoint de salud del middleware
app.get('/api/middleware/health', (req, res) => {
    res.json({ 
        status: 'UP', 
        message: 'Middleware funcionando correctamente',
        timestamp: new Date().toISOString()
    });
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

// Rutas específicas para las páginas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Manejar otras rutas HTML específicas
app.get('/pages/:page', (req, res) => {
    const page = req.params.page;
    const filePath = path.join(__dirname, 'pages', page);
    
    // Verificar si el archivo existe
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(`Error al servir página ${page}:`, err);
            res.status(404).sendFile(path.join(__dirname, 'pages', '404.html'));
        }
    });
});

app.use((req, res, next) => {
    // Verificar si la solicitud es para default.jpg
    if (req.url === '/assets/images/default.jpg') {
        const filePath = path.join(__dirname, 'assets', 'images', 'default.jpg');
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ El archivo ${filePath} no existe. Esto causa errores 404 recurrentes.`);
            // Servir una imagen SVG en línea como fallback
            res.setHeader('Content-Type', 'image/svg+xml');
            res.send(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                <rect width="200" height="200" fill="#f8f9fa"/>
                <text x="100" y="100" font-family="Arial" font-size="14" text-anchor="middle" fill="#6c757d">Imagen no disponible</text>
            </svg>`);
            return;
        }
    }
    next();
});

// Manejo de rutas para archivos específicos
app.get('/cart.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'cart.html'));
});

app.get('/product-detail.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'product-detail.html'));
});

// Middleware para manejo de errores 404
app.use((req, res, next) => {
    // Solo imprimir para rutas de API
    if (req.path.startsWith('/api/')) {
        console.log(`📨 [${new Date().toISOString()}] ${req.method} ${req.path}`);
        
        // Guardar el tiempo inicial
        req.startTime = Date.now();
        
        // Capturar la respuesta original
        const originalSend = res.send;
        res.send = function() {
            // Calcular tiempo de respuesta
            const responseTime = Date.now() - req.startTime;
            console.log(`📤 [${new Date().toISOString()}] Respuesta ${res.statusCode} en ${responseTime}ms para ${req.method} ${req.path}`);
            
            // Llamar a la función original
            return originalSend.apply(res, arguments);
        };
    }
    next();
});

// Middleware para manejo de errores generales
app.use((err, req, res, next) => {
    console.error('Error en middleware:', err);
    
    if (res.headersSent) {
        return next(err);
    }
    
    // Si la petición es hacia la API
    if (req.path.startsWith('/api/')) {
        return res.status(500).json({ 
            message: 'Error interno del servidor',
            error: err.message
        });
    }
    
    // Error genérico para peticiones web
    res.status(500).send('Error interno del servidor');
});


app.use('/api/:service', (req, res, next) => {
    // Excluir servicios ya configurados
    const excludedServices = ['usuarios', 'auth', 'direcciones', 'soap', 'middleware', 'health', 'ping', 'categorias', 'productos'];
    
    if (!excludedServices.includes(req.params.service)) {
        console.log(`Redirigiendo servicio genérico: ${req.params.service}`);
        createProxyMiddleware({
            target: 'http://localhost:3000',
            changeOrigin: true,
            pathRewrite: {
                [`^/api/${req.params.service}`]: `/api/${req.params.service}`
            },
            onError: (err, req, res) => {
                console.error(`Error en proxy API ${req.params.service}:`, err);
                res.status(503).json({ message: 'Servicio no disponible', error: err.message });
            }
        })(req, res, next);
    } else {
        next();
    }
});

app.use('/api/categorias', createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
    pathRewrite: {
        '^/api/categorias': '/api/categorias'
    },
    onError: (err, req, res) => {
        console.error('Error en proxy API Categorías:', err);
        res.status(503).json({ message: 'Servicio no disponible', error: err.message });
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🔄 Proxy redireccionando ${req.method} a categorías: ${proxyReq.path}`);
    }
}));

// Proxy para productos
app.use('/api/productos', createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
    pathRewrite: {
        '^/api/productos': '/api/productos'
    },
    onError: (err, req, res) => {
        console.error('Error en proxy API Productos:', err);
        res.status(503).json({ message: 'Servicio no disponible', error: err.message });
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🔄 Proxy redireccionando ${req.method} a productos: ${proxyReq.path}`);
    }
}));

// Proxy para marcas
app.use('/api/marcas', createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
    pathRewrite: {
        '^/api/marcas': '/api/marcas'
    },
    onError: (err, req, res) => {
        console.error('Error en proxy API Marcas:', err);
        res.status(503).json({ message: 'Servicio no disponible', error: err.message });
    }
}));



// Iniciar el servidor y los clientes SOAP
app.listen(PORT, async () => {
    console.log(`🚀 Middleware iniciado en http://localhost:${PORT}`);
    await initSoapClients();
    console.log(`📄 Frontend disponible en http://localhost:${PORT}`);
    console.log(`🔌 Proxy a API de usuarios configurado (puerto 3003)`);
});