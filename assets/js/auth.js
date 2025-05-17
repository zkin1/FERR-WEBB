document.addEventListener('DOMContentLoaded', function() {
    // Actualizar UI de autenticación al cargar la página
    setTimeout(updateAuthUI, 100);

    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    const success = urlParams.get('success');
    
    console.log('Parámetros de URL:', { redirect, success });

    // *** MEJORA: Manejo más robusto de la redirección ***
    if (success === 'true' && redirect) {
        console.log('Redireccionando a:', decodeURIComponent(redirect));
        
        // Limpiar la URL actual (remover parámetros)
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // *** MODIFICACIÓN: Verificar autenticación con ambos tokens posibles ***
        const isAuthed = !!localStorage.getItem('userAuthToken') || !!localStorage.getItem('auth_token');
        
        if (isAuthed) {
            // *** MEJORA: Sincronizar los tokens ***
            sincronizarTokens();
            
            // Pequeño retraso para asegurar que todo esté listo
            setTimeout(() => {
                window.location.href = decodeURIComponent(redirect);
            }, 500);
        } else {
            console.error('Error: Redirección solicitada pero usuario no autenticado');
        }
    }
    
    // Configurar evento de cierre de sesión
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }

    // Verificar token al cargar la página
    validateSession();
    
    // Verificar acceso admin si estamos en una página admin
    if (window.location.pathname.startsWith('/admin/')) {
        verificarAccesoAdmin();
    }
    
    // *** NUEVO: Verificar si estamos en checkout para asegurar autenticación ***
    if (window.location.pathname.includes('checkout.html')) {
        handleCheckoutAuth();
    }
});

// *** NUEVA FUNCIÓN: Sincronizar tokens entre diferentes nombres ***
function sincronizarTokens() {
    const userAuthToken = localStorage.getItem('userAuthToken');
    const authToken = localStorage.getItem('auth_token');
    
    if (userAuthToken && !authToken) {
        localStorage.setItem('auth_token', userAuthToken);
    } else if (authToken && !userAuthToken) {
        localStorage.setItem('userAuthToken', authToken);
    }
}

// *** NUEVA FUNCIÓN: Manejar autenticación específica para checkout ***
function handleCheckoutAuth() {
    console.log('Verificando autenticación para checkout...');
    
    // Verificar si el usuario está autenticado
    const token = localStorage.getItem('userAuthToken') || localStorage.getItem('auth_token');
    
    if (!token) {
        console.log('Usuario no autenticado en checkout, redirigiendo a login');
        // Guardar la URL actual para volver después del login
        const currentUrl = window.location.pathname + window.location.search;
        window.location.href = '/pages/login.html?redirect=' + encodeURIComponent(currentUrl);
        return;
    }
    
    // Sincronizar tokens para evitar problemas
    sincronizarTokens();
    
    console.log('Usuario autenticado en checkout, continuando...');
}

// Función para cerrar sesión
function logout() {
    // Usar userApi para cerrar sesión
    if (window.userApi) {
        window.userApi.logout();
    } else {
        // Eliminar ambos tokens para asegurar cierre completo
        localStorage.removeItem('userAuthToken');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('currentUser');
        
        // Borrar cookie
        document.cookie = 'authToken=; path=/; max-age=0';
    }
    
    // Actualizar UI
    updateAuthUI();
    
    // Mostrar mensaje
    if (typeof showToast === 'function') {
        showToast('Has cerrado sesión correctamente');
    }
    
    // Redirigir sin parámetros
    window.location.href = '/index.html';
}

// Función para actualizar la UI según el estado de autenticación
function updateAuthUI() {
    console.log('Actualizando UI de autenticación...');
    
    // Elementos que debemos mostrar/ocultar - buscamos de todas las formas posibles
    const authButtons = document.querySelector('.auth-buttons');
    const authButtonsById = document.getElementById('auth-buttons');
    const userDropdown = document.querySelector('.user-dropdown');
    const userDropdownById = document.getElementById('user-menu');
    const usernameDisplay = document.getElementById('username-display');
    
    // Combinar los resultados de las búsquedas
    const authElements = [authButtons, authButtonsById].filter(Boolean);
    const userElements = [userDropdown, userDropdownById].filter(Boolean);
    
    // Verificar si encontramos los elementos
    if (authElements.length === 0 || userElements.length === 0) {
        console.warn('No se encontraron todos los elementos de autenticación en la página');
    }
    
    // *** MEJORA: Verificar ambos tokens posibles ***
    const token = localStorage.getItem('userAuthToken') || localStorage.getItem('auth_token');
    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const isAuthenticated = token && Object.keys(userData).length > 0;
    
    console.log('Estado de autenticación:', isAuthenticated ? 'Autenticado' : 'No autenticado');
    
    if (isAuthenticated) {
        // USUARIO AUTENTICADO
        
        // Actualizar nombre de usuario
        if (usernameDisplay) {
            usernameDisplay.textContent = userData.nombre || 'Usuario';
        }
        
        // OCULTAR botones de inicio/registro
        authElements.forEach(element => {
            if (element) {
                // Aplicar múltiples métodos para asegurar que quede oculto
                element.style.cssText = 'display: none !important';
                element.classList.add('d-none');
                element.setAttribute('aria-hidden', 'true');
            }
        });
        
        // MOSTRAR menú de usuario
        userElements.forEach(element => {
            if (element) {
                // Eliminar cualquier estilo inline que pudiera causar conflicto
                element.removeAttribute('style');
                // Establecer como visible de varias formas
                element.style.cssText = 'display: flex !important';
                element.classList.remove('d-none');
                element.setAttribute('aria-hidden', 'false');
            }
        });
        
        // Si es administrador, mostrar opción de administración
        const adminMenuItem = document.getElementById('admin-menu-item');
        if (adminMenuItem && userData.rol === 'admin') {
            adminMenuItem.style.display = 'block';
        }
    } else {
        // USUARIO NO AUTENTICADO
        
        // MOSTRAR botones de inicio/registro
        authElements.forEach(element => {
            if (element) {
                // Eliminar cualquier estilo que pudiera estar ocultándolo
                element.removeAttribute('style');
                // Establecer como visible
                element.style.cssText = 'display: flex !important';
                element.classList.remove('d-none');
                element.setAttribute('aria-hidden', 'false');
            }
        });
        
        // OCULTAR menú de usuario
        userElements.forEach(element => {
            if (element) {
                // Aplicar múltiples métodos para asegurar que quede oculto
                element.style.cssText = 'display: none !important';
                element.classList.add('d-none');
                element.setAttribute('aria-hidden', 'true');
            }
        });
        
        // Ocultar opción de administración
        const adminMenuItem = document.getElementById('admin-menu-item');
        if (adminMenuItem) {
            adminMenuItem.style.display = 'none';
        }
    }
    
    console.log('UI de autenticación actualizada');
}

// Nueva función para verificar acceso admin
function verificarAccesoAdmin() {
    // *** MEJORA: Verificar ambos tokens posibles ***
    const token = localStorage.getItem('userAuthToken') || localStorage.getItem('auth_token');
    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Verificar elementos de overlays de autenticación
    const overlay = document.getElementById('auth-overlay');
    
    if (!token) {
        console.error('No hay token de autenticación');
        window.location.href = '/pages/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return false;
    }
    
    // Verificar rol desde userData (más confiable que decodificar el token)
    if (!userData || userData.rol !== 'admin') {
        console.error('Acceso denegado: se requieren permisos de administrador');
        // Ocultar overlay si existe antes de redirigir
        if (overlay) overlay.style.display = 'none';
        window.location.href = '/pages/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return false;
    }
    
    // Si hay div de overlay, ocultarlo
    if (overlay) overlay.style.display = 'none';
    
    console.log('Acceso de administrador verificado');
    
    // Mostrar solo módulos relevantes para administradores
    limitarModulosAdmin();
    
    return true;
}

function limitarModulosAdmin() {
    // Solo si estamos en alguna página de admin
    if (!window.location.pathname.includes('/admin/')) return;
    
    // Obtener todos los elementos de navegación admin
    const navItems = document.querySelectorAll('.navbar-nav .nav-item');
    
    // Ocultar todos excepto Crud e Inventario
    navItems.forEach(item => {
        const link = item.querySelector('.nav-link');
        if (link) {
            const href = link.getAttribute('href');
            // Mostrar solo CRUD e Inventario
            if (href && (href.includes('crud.html') || href.includes('inventario.html'))) {
                item.style.display = 'block';
            } else if (href && !href.includes('index.html')) { // Mantener el Dashboard/Index
                item.style.display = 'none';
            }
        }
    });
}

// Función para validar sesión activa
async function validateSession() {
    // *** MEJORA: Verificar ambos tokens posibles ***
    const token = localStorage.getItem('userAuthToken') || localStorage.getItem('auth_token');
    
    if (token && window.userApi) {
        try {
            // Añadir timeout para la validación
            const controllerTimeout = new AbortController();
            const timeoutId = setTimeout(() => controllerTimeout.abort(), 5000);
            
            // Validar token con la API con timeout
            const response = await Promise.race([
                window.userApi.validateToken(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout al validar token')), 5000)
                )
            ]);
            
            clearTimeout(timeoutId);
            
            // Actualizar datos del usuario en localStorage
            if (response && response.usuario) {
                localStorage.setItem('currentUser', JSON.stringify(response.usuario));
                
                // *** MEJORA: Guardar token en ambos formatos para compatibilidad ***
                localStorage.setItem('userAuthToken', token);
                localStorage.setItem('auth_token', token);
                
                // Guardar token en cookie (para uso del middleware)
                document.cookie = `authToken=${token}; path=/; max-age=86400; samesite=strict`;
                
                updateAuthUI();
            }
        } catch (error) {
            console.error('Error al validar sesión:', error);
            
            // MODIFICADO: No cerrar sesión automáticamente para evitar bucles infinitos
            // Solo actualizar la UI en lugar de hacer logout
            updateAuthUI();
            
            // Mostrar mensaje de error en lugar de cerrar sesión automáticamente
            if (typeof showToast === 'function') {
                showToast('Error de conexión con el servicio de autenticación', 'warning');
            }
        }
    }
}

function handleLoginRedirection() {
    // Verificar si venimos de una redirección de login
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    
    // Si hay una URL de redirección
    if (redirect) {
        console.log('Detectada redirección a:', decodeURIComponent(redirect));
        
        // *** MEJORA: Verificar ambos tokens posibles ***
        const token = localStorage.getItem('userAuthToken') || localStorage.getItem('auth_token');
        const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const isAuthenticated = token && Object.keys(userData).length > 0;
        
        if (isAuthenticated) {
            // Limpiar la URL actual (remover parámetros)
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Pequeño retraso para asegurar que todo esté listo
            setTimeout(() => {
                window.location.href = decodeURIComponent(redirect);
            }, 500);
        }
    }
}

function enhancedLogin(email, password) {
    // Conservar la URL de redirección
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    
    // Mostrar indicador de carga si existe
    const loginSpinner = document.getElementById('login-spinner');
    if (loginSpinner) loginSpinner.style.display = 'inline-block';
    
    // Usar la API de usuario existente
    window.userApi.login(email, password)
        .then(response => {
            // *** MEJORA: Guardar token en ambos formatos para compatibilidad ***
            window.userApi.setToken(response.token);
            localStorage.setItem('userAuthToken', response.token);
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('currentUser', JSON.stringify(response.usuario));
            
            // Notificar cambio en autenticación
            document.dispatchEvent(new Event('login_success'));
            
            // Mostrar mensaje de éxito si existe la función
            if (typeof showToast === 'function') {
                showToast('Login exitoso', 'success');
            }
            
            // *** MEJORA: Manejar explícitamente redirección a checkout ***
            setTimeout(() => {
                if (redirect) {
                    // Si estamos redirigiendo a checkout, añadir parámetro de éxito
                    const decodedRedirect = decodeURIComponent(redirect);
                    if (decodedRedirect.includes('checkout.html')) {
                        window.location.href = decodedRedirect + (decodedRedirect.includes('?') ? '&' : '?') + 'success=true';
                    } else {
                        window.location.href = decodedRedirect;
                    }
                } else {
                    window.location.href = '/index.html';
                }
            }, 1000);
        })
        .catch(error => {
            console.error('Error en login:', error);
            
            // Mostrar mensaje de error
            const errorElement = document.getElementById('login-error');
            if (errorElement) {
                errorElement.textContent = error.message || 'Error al iniciar sesión';
                errorElement.style.display = 'block';
            } else if (typeof showToast === 'function') {
                showToast(error.message || 'Error al iniciar sesión', 'error');
            }
        })
        .finally(() => {
            // Ocultar spinner
            if (loginSpinner) loginSpinner.style.display = 'none';
        });
}

document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la página de login
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        console.log('Formulario de login detectado, configurando eventos');
        
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            enhancedLogin(email, password);
        });
    }
    
    // Verificar si necesitamos manejar redirección
    handleLoginRedirection();
});