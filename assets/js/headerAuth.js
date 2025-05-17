document.addEventListener('DOMContentLoaded', () => {
  // Esperar a que el DOM esté completamente cargado
  setTimeout(() => {
    initHeaderAuth();
  }, 100); // Pequeño retraso para asegurar que todo esté listo
  
  // Escuchar cambios en localStorage
  window.addEventListener('storage', (e) => {
    if (e.key === 'userAuthToken' || e.key === 'currentUser') {
      initHeaderAuth();
    }
  });
  
  // Delegación de eventos para botón de logout
  document.addEventListener('click', (e) => {
    if (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn')) {
      e.preventDefault();
      logout();
    }
  });
});

// Inicializar el componente de autenticación con manejo de errores
function initHeaderAuth() {
  // Buscar el contenedor
  const authContainer = document.getElementById('headerAuthContainer');
  
  // IMPORTANTE: Verificar si existe el contenedor
  if (!authContainer) {
    console.warn('No se encontró el elemento headerAuthContainer');
    return; // Salir si no existe
  }
  
  // Obtener información de autenticación
  const token = localStorage.getItem('userAuthToken');
  let currentUser = {};
  
  try {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      currentUser = JSON.parse(userData);
    }
  } catch (e) {
    console.error('Error al parsear datos de usuario:', e);
  }
  
  // Verificar autenticación
  const isLoggedIn = !!token;
  
  // Actualizar UI
  updateAuthUI(authContainer, isLoggedIn, currentUser);
}

// Actualizar UI con manejo de errores
function updateAuthUI(container, isLoggedIn, user = {}) {
  // IMPORTANTE: Verificar de nuevo si existe el contenedor
  if (!container) {
    console.error('Container es undefined en updateAuthUI');
    return;
  }
  
  try {
    if (isLoggedIn) {
      // UI para usuario autenticado
      container.innerHTML = `
        <div class="dropdown">
          <button class="btn btn-outline-primary dropdown-toggle" type="button" id="userMenuDropdown" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-person-circle"></i> 
            ${user.nombre || user.email || 'Usuario'}
          </button>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userMenuDropdown">
            ${user.email ? `<li><h6 class="dropdown-header">${user.email}</h6></li>` : ''}
            <li><a class="dropdown-item" href="profile.html"><i class="bi bi-person"></i> Mi Perfil</a></li>
            <li><a class="dropdown-item" href="orders.html"><i class="bi bi-box"></i> Mis Pedidos</a></li>
            ${user.rol === 'admin' ? 
              `<li><a class="dropdown-item text-primary" href="admin/index.html"><i class="bi bi-speedometer2"></i> Panel de Administración</a></li>` : 
              ''}
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right"></i> Cerrar Sesión</a></li>
          </ul>
        </div>
      `;
    } else {
      // UI para usuario no autenticado
      container.innerHTML = `
        <div class="d-flex">
          <a href="login.html" class="btn btn-outline-primary me-2">
            <i class="bi bi-box-arrow-in-right"></i> Ingresar
          </a>
          <a href="register.html" class="btn btn-primary">
            <i class="bi bi-person-plus"></i> Registrarse
          </a>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error al actualizar UI de autenticación:', error);
  }
}

// Función de cierre de sesión
function logout() {
  // Limpiar localStorage
  localStorage.removeItem('userAuthToken');
  localStorage.removeItem('currentUser');
  
  // Limpiar cookies
  document.cookie = 'authToken=; path=/; max-age=0';
  
  // Intentar actualizar UI antes de redireccionar
  try {
    const authContainer = document.getElementById('headerAuthContainer');
    if (authContainer) {
      updateAuthUI(authContainer, false, {});
    }
  } catch (e) {
    console.error('Error al actualizar UI durante logout:', e);
  }
  
  // Redireccionar
  window.location.href = 'index.html?logout=' + new Date().getTime();
  return false;
}