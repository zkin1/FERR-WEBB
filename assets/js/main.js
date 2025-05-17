
// Variables globales
const API_BASE_URL = '/api';

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando aplicación FERREMAS...');
    
    // SECCIÓN 1: INICIALIZACIÓN BÁSICA
    
    // Verificar conexión a la API antes de inicializar
    if (window.APP_CONFIG && typeof window.APP_CONFIG.verifyApiConnection === 'function') {
        window.APP_CONFIG.verifyApiConnection()
            .then(() => {
                console.log('API disponible, iniciando componentes de la aplicación');
                initAppComponents();
            })
            .catch(error => {
                console.error('No se pudo conectar a la API:', error);
                showAPIErrorMessage();
                // Intentar inicializar con datos locales o de muestra
                initAppComponents(true);
            });
    } else {
        // Si no hay función de verificación, inicializar directamente
        console.log('No se encontró configuración de API, iniciando con datos locales');
        initAppComponents(true);
    }
    
    // SECCIÓN 2: FUNCIONES DE INICIALIZACIÓN
    
    // Inicializar componentes de la aplicación
    function initAppComponents(useFallback = false) {
        // Autenticación y carrito siempre se inicializan primero
        initAuthSystem();
        
        // Actualizar interfaz de usuario según rol
        updateUIByRole();
        
        // Inicializar carrito si está disponible
        if (typeof initCart === 'function') {
            initCart();
            updateCartCount();
        }
        
        // Cargar datos específicos de la página actual
        const currentPath = window.location.pathname;
        
        // Página principal
        if (currentPath === '/' || currentPath.includes('index.html')) {
            // Cargar componentes de la página principal
            if (typeof loadCategories === 'function') loadCategories();
            if (typeof loadFeaturedProducts === 'function') loadFeaturedProducts();
            if (typeof loadNewProducts === 'function') loadNewProducts();
        }
        
        // Páginas de categorías
        else if (currentPath.includes('categorias.html')) {
            if (typeof loadCategoriesPage === 'function') loadCategoriesPage();
        }
        
        // Página de carrito
        else if (currentPath.includes('cart.html')) {
            if (typeof renderCart === 'function') renderCart();
        }
        
        // Configurar eventos globales
        setupGlobalEventListeners();
    }
    
    // Inicializar sistema de autenticación
    function initAuthSystem() {
        console.log('Inicializando sistema de autenticación');
        
        // Actualizar UI según estado de autenticación
        updateAuthDisplay();
        
        // Configurar evento de logout
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', function(e) {
                e.preventDefault();
                
                if (typeof logout === 'function') {
                    logout();
                } else {
                    // Implementación básica si no existe función logout
                    localStorage.removeItem('userAuthToken');
                    localStorage.removeItem('currentUser');
                    window.location.href = '/index.html';
                }
            });
        }
    }
    
    // Configurar eventos globales
    function setupGlobalEventListeners() {
        // Configurar botones de agregar al carrito
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', function() {
                if (typeof addToCart !== 'function') return;
                
                const productData = {
                    id: this.dataset.id,
                    nombre: this.dataset.nombre,
                    precio: parseFloat(this.dataset.precio),
                    imagen: this.dataset.imagen,
                    cantidad: 1
                };
                
                addToCart(productData);
            });
        });
        
        // Escuchar cambios en localStorage para mantener sincronización
        window.addEventListener('storage', function(e) {
            if (e.key === 'userAuthToken' || e.key === 'currentUser') {
                updateAuthDisplay();
                updateUIByRole();
                if (typeof updateCartCount === 'function') updateCartCount();
            }
        });
    }
    
    // Mostrar mensaje de error de API
    function showAPIErrorMessage() {
        const container = document.createElement('div');
        container.className = 'alert alert-warning mx-3 mt-3';
        container.innerHTML = '<strong>Advertencia:</strong> No se pudo conectar con el servidor. Algunos datos pueden no estar actualizados.';
        document.body.insertBefore(container, document.body.firstChild);
    }
    
    // SECCIÓN 3: GESTIÓN DE AUTENTICACIÓN UI
    
    // Actualizar UI según el rol del usuario
    function updateUIByRole() {
        // Si las funciones ya están definidas en la página, usarlas
        const getUserRoleFunc = window.getUserRole || function() {
            try {
                const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
                return userData.rol || 'guest';
            } catch (e) {
                console.error('Error al obtener rol de usuario:', e);
                return 'guest';
            }
        };
        
        const isAuthenticatedFunc = window.isAuthenticated || function() {
            return localStorage.getItem('userAuthToken') !== null;
        };
        
        const role = getUserRoleFunc();
        const isAuth = isAuthenticatedFunc();
        
        // Elementos que se muestran solo a usuarios normales (clientes)
        const userOnlyElements = document.querySelectorAll('.user-only');
        
        // Elementos que se muestran solo a administradores
        const adminOnlyElements = document.querySelectorAll('.admin-only');
        
        // Mostrar/ocultar según rol
        userOnlyElements.forEach(element => {
            element.style.display = isAuth ? 'block' : 'none';
        });
        
        adminOnlyElements.forEach(element => {
            element.style.display = (isAuth && role === 'admin') ? 'block' : 'none';
        });
        
        // También actualizar el elemento en el dropdown
        const adminMenuItem = document.getElementById('admin-menu-item');
        if (adminMenuItem) {
            adminMenuItem.style.display = (isAuth && role === 'admin') ? 'block' : 'none';
        }
    }
    
    // Función para actualizar la UI de autenticación
    function updateAuthDisplay() {
        // Verificar si hay un usuario autenticado
        const token = localStorage.getItem('userAuthToken') || 
                   localStorage.getItem('auth_token');
        const userDataStr = localStorage.getItem('currentUser') || 
                      localStorage.getItem('user');
                      
        let userData = {};
        try {
            if (userDataStr) userData = JSON.parse(userDataStr);
        } catch (e) {
            console.error('Error al parsear datos de usuario:', e);
        }
        
        // Elementos de UI para autenticación
        const authButtons = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        const usernameDisplay = document.getElementById('username-display');
        
        // Buscar botones específicamente por su texto
        const loginBtns = [];
        const registerBtns = [];
        
        // Usar un enfoque directo para encontrar los botones
        document.querySelectorAll('a, button').forEach(element => {
            const text = element.textContent.trim();
            if (text === 'Iniciar Sesión' || text.includes('Iniciar Sesión')) {
                loginBtns.push(element);
            }
            if (text === 'Registrarse' || text.includes('Registrarse')) {
                registerBtns.push(element);
            }
        });
        
        // También buscar por atributos href
        document.querySelectorAll('a[href*="login"], a[href*="register"]').forEach(element => {
            if (element.href.includes('login')) {
                loginBtns.push(element);
            }
            if (element.href.includes('register')) {
                registerBtns.push(element);
            }
        });
        
        console.log('Estado de autenticación:', token ? 'Autenticado' : 'No autenticado');
        console.log('Botones de login encontrados:', loginBtns.length);
        console.log('Botones de registro encontrados:', registerBtns.length);
        
        // Si está autenticado
        if (token && Object.keys(userData).length > 0) {
            console.log('Usuario autenticado, actualizando UI');
            
            // Ocultar botones de inicio de sesión y registro
            if (authButtons) authButtons.style.display = 'none';
            
            // Ocultar todos los botones de login encontrados
            loginBtns.forEach(btn => {
                if (btn && btn.style) btn.style.display = 'none';
            });
            
            // Ocultar todos los botones de registro encontrados
            registerBtns.forEach(btn => {
                if (btn && btn.style) btn.style.display = 'none';
            });
            
            // Mostrar menú de usuario
            if (userMenu) {
                userMenu.style.removeProperty('display');
                userMenu.style.display = 'block';
            }
            
            // Actualizar nombre de usuario
            if (usernameDisplay) {
                usernameDisplay.textContent = userData.nombre || userData.email || 'Usuario';
            }
        } else {
            // No autenticado, mostrar botones de inicio de sesión y registro
            if (authButtons) authButtons.style.display = 'flex';
            
            // Mostrar todos los botones de login encontrados
            loginBtns.forEach(btn => {
                if (btn && btn.style) btn.style.display = '';
            });
            
            // Mostrar todos los botones de registro encontrados
            registerBtns.forEach(btn => {
                if (btn && btn.style) btn.style.display = '';
            });
            
            // Ocultar menú de usuario
            if (userMenu) userMenu.style.display = 'none';
        }
    }
    
    // Detector de cambios para localStorage
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        // Llamar a la función original
        originalSetItem.apply(this, arguments);
        
        // Si la clave está relacionada con autenticación, actualizar UI
        if (key.includes('token') || key.includes('user')) {
            console.log('Cambio en localStorage detectado, actualizando UI');
            updateAuthDisplay();
            updateUIByRole();
        }
    };
    
    // También ejecutar al navegar con botones de historial
    window.addEventListener('popstate', function() {
        updateAuthDisplay();
        updateUIByRole();
    });
    
    // Exponer funciones globalmente
    window.updateAuthDisplay = updateAuthDisplay;
    window.updateUIByRole = updateUIByRole;
});