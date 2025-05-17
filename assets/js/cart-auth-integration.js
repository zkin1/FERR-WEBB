// cart-auth-integration.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando integración carrito-autenticación');
    
    // Constantes para almacenamiento
    const AUTH_TOKEN_KEY = 'userAuthToken';
    const USER_DATA_KEY = 'currentUser';
    
    // Función mejorada para verificar autenticación
    window.isAuthenticatedSecure = function() {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const userData = localStorage.getItem(USER_DATA_KEY);
        
        // Verificación más robusta
        if (!token || !userData) return false;
        
        try {
            // Asegurar que el objeto de usuario es válido
            const userObj = JSON.parse(userData);
            return token && userObj && userObj.id;
        } catch (e) {
            console.error('Error al analizar datos de usuario:', e);
            return false;
        }
    };
    
    // Sobreescribir la función de verificación de autenticación del carrito
    if (typeof isAuthenticated === 'function') {
        console.log('Extendiendo función isAuthenticated para mayor robustez');
        window.isAuthenticated = window.isAuthenticatedSecure;
    }
    
    // Interceptar eventos de logout para asegurar sincronización
    if (typeof logout === 'function') {
        console.log('Extendiendo función logout para sincronizar con carrito');
        const originalLogout = logout;
        window.logout = function() {
            console.log('Cerrando sesión, sincronizando carrito...');
            
            // Notificar al carrito antes de cerrar sesión
            if (typeof notifyAuthChange === 'function') {
                notifyAuthChange('logout');
            }
            
            // Notificar a otros componentes mediante eventos
            document.dispatchEvent(new Event('logout_success'));
            
            // Ejecutar logout original
            return originalLogout.apply(this, arguments);
        };
    }
    
    // Detectar cambios de autenticación en tiempo real
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        // Llamar a la implementación original
        originalSetItem.apply(this, arguments);
        
        // Detectar cambios en token o datos de usuario
        if (key === AUTH_TOKEN_KEY || key === USER_DATA_KEY) {
            console.log(`Estado de autenticación modificado: ${key}`);
            
            // Determinar si es login o logout
            const isLoginEvent = value && value !== 'null' && value !== '{}';
            const eventType = isLoginEvent ? 'login' : 'logout';
            
            // Sincronizar con carrito
            if (typeof notifyAuthChange === 'function') {
                notifyAuthChange(eventType);
            }
            
            // Actualizar UI si es necesario
            if (typeof updateCartCount === 'function') {
                setTimeout(updateCartCount, 100);
            }
        }
    };
    
    // Corregir problema de carrito en página de detalle de producto
    const productDetailInit = function() {
        if (window.location.pathname.includes('product-detail.html')) {
            console.log('Inicializando página de detalle con autenticación verificada');
            
            // Verificar autenticación al cargar la página
            if (window.isAuthenticatedSecure()) {
                console.log('Usuario autenticado en detalle de producto, habilitando carrito');
                
                // Forzar actualización del carrito
                if (typeof updateCartCount === 'function') {
                    updateCartCount();
                }
                
                // Asegurar que los event listeners del carrito estén correctamente inicializados
                document.querySelectorAll('.add-to-cart, .add-to-cart-detail').forEach(btn => {
                    // Eliminar listeners anteriores para evitar duplicados
                    const newBtn = btn.cloneNode(true);
                    btn.parentNode.replaceChild(newBtn, btn);
                    
                    // Agregar listener correctamente
                    newBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Re-verificar autenticación justo antes de agregar al carrito
                        if (!window.isAuthenticatedSecure()) {
                            console.warn('Usuario no autenticado al intentar agregar al carrito');
                            
                            if (typeof showToast === 'function') {
                                showToast('Debes iniciar sesión para agregar productos al carrito', 'warning');
                            }
                            
                            // Redirigir al login después de un breve retraso
                            setTimeout(() => {
                                window.location.href = '/pages/login.html?redirect=' + encodeURIComponent(window.location.href);
                            }, 2000);
                            
                            return false;
                        }
                        
                        // Obtener datos del producto desde el botón
                        if (this.hasAttribute('data-id')) {
                            // Para botones en listados
                            const productData = {
                                id: this.dataset.id,
                                nombre: this.dataset.nombre,
                                precio: parseFloat(this.dataset.precio),
                                imagen: this.dataset.imagen,
                                cantidad: 1
                            };
                            
                            if (typeof addToCart === 'function') {
                                addToCart(productData);
                            }
                        } else {
                            // Para botón en detalle de producto
                            console.log('Agregando desde detalle de producto');
                            // El handler original ya debería estar configurado
                        }
                    });
                });
            } else {
                console.log('Usuario no autenticado en detalle de producto');
            }
        }
    };
    
    // Ejecutar inicialización para detalle de producto
    productDetailInit();
    
    // Re-aplicar en cambios de ruta
    window.addEventListener('popstate', productDetailInit);
});