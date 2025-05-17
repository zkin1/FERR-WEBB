const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

/**
 * Middleware para verificar token JWT en API
 */
exports.verificarToken = (req, res, next) => {
  try {
    // Obtener token de header o cookie
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.authToken;
    
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (cookieToken) {
      token = cookieToken;
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }
    
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded) {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }
    
    // Añadir información del usuario al request
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Error en verificación de token:', error);
    res.status(401).json({ message: 'Error en autenticación', error: error.message });
  }
};

/**
 * Middleware para verificar rol de administrador
 */
exports.esAdmin = (req, res, next) => {
  // Verificar si el usuario tiene rol 'admin'
  if (req.user && req.user.rol === 'admin') {
    next(); // Continuar si es admin
  } else {
    res.status(403).json({ message: 'Acceso denegado: Se requiere rol de administrador' });
  }
};

/**
 * Middleware para verificar roles específicos
 */
exports.tieneRol = (rolesPermitidos) => {
  return (req, res, next) => {
    // Verificar si el usuario tiene uno de los roles permitidos
    if (req.user && rolesPermitidos.includes(req.user.rol)) {
      next(); // Continuar si tiene un rol permitido
    } else {
      res.status(403).json({ message: 'Acceso denegado: No tienes permisos suficientes' });
    }
  };
};

/**
 * Middleware para proteger rutas admin en el servidor web
 */
exports.protegerRutaAdmin = (req, res, next) => {
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
      return res.status(403).sendFile(path.join(__dirname, '..', 'pages', 'acceso-denegado.html'));
    }
    
    // Agregar info del usuario al request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error verificando token:', error);
    res.redirect('/login.html?redirect=' + encodeURIComponent(req.originalUrl));
  }
};