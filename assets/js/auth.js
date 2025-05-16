document.addEventListener('DOMContentLoaded', function() {
    // Actualizar UI de autenticación al cargar la página
    setTimeout(updateAuthUI, 100); // Añadimos un pequeño retraso para asegurar que todo el DOM esté listo
    
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
});

// Función para cerrar sesión
function logout() {
    // Usar userApi para cerrar sesión
    if (window.userApi) {
        window.userApi.logout();
    } else {
        // Fallback si userApi no está disponible
        localStorage.removeItem('userAuthToken');
        localStorage.removeItem('currentUser');
    }
    
    // Actualizar UI
    updateAuthUI();
    
    // Mostrar mensaje
    if (typeof showToast === 'function') {
        showToast('Has cerrado sesión correctamente');
    }
    
    // Opcionalmente, redirigir a la página principal
    // window.location.href = '/index.html';
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
    
    // Verificar si el usuario está autenticado
    const token = localStorage.getItem('userAuthToken');
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

// Función para validar sesión activa
async function validateSession() {
    const token = localStorage.getItem('userAuthToken');
    
    if (token && window.userApi) {
        try {
            // Validar token con la API
            const response = await window.userApi.validateToken();
            
            // Actualizar datos del usuario en localStorage
            if (response && response.usuario) {
                localStorage.setItem('currentUser', JSON.stringify(response.usuario));
                updateAuthUI();
            }
        } catch (error) {
            console.error('Error al validar sesión:', error);
            // Token inválido, cerrar sesión
            logout();
        }
    }
}