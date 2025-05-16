import userApi from './userApi.js';
import Config from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  // Buscar el contenedor del componente de autenticación en el header
  const authContainer = document.getElementById('headerAuthContainer');
  if (!authContainer) return;
  
  // Verificar si hay un usuario autenticado
  const token = localStorage.getItem(Config.storage.tokenKey);
  const currentUser = JSON.parse(localStorage.getItem(Config.storage.userKey) || '{}');
  
  // Actualizar UI según el estado de autenticación
  updateAuthUI(authContainer, !!token, currentUser);
  
  // Si hay token, verificar que sea válido
  if (token) {
    validateUserSession();
  }
  
  // Manejar botón de cerrar sesión
  document.addEventListener('click', (e) => {
    if (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn')) {
      e.preventDefault();
      logout();
    }
  });
});

// Actualizar UI del componente de autenticación
function updateAuthUI(container, isLoggedIn, user = {}) {
  if (isLoggedIn && user.id) {
    // UI para usuario autenticado
    container.innerHTML = `
      <div class="dropdown">
        <button class="btn btn-outline-light dropdown-toggle" type="button" id="userMenuDropdown" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-person-circle"></i> 
          ${user.nombre || 'Usuario'}
        </button>
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userMenuDropdown">
          <li><h6 class="dropdown-header">${user.email}</h6></li>
          <li><a class="dropdown-item" href="profile.html"><i class="bi bi-person"></i> Mi Perfil</a></li>
          <li><a class="dropdown-item" href="orders.html"><i class="bi bi-box"></i> Mis Pedidos</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item text-danger" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right"></i> Cerrar Sesión</a></li>
        </ul>
      </div>
    `;
    
    // Si el usuario es admin, agregar acceso al panel
    if (user.rol === 'admin') {
      const menuDropdown = container.querySelector('.dropdown-menu');
      const divider = container.querySelector('.dropdown-divider');
      
      const adminItem = document.createElement('li');
      adminItem.innerHTML = `<a class="dropdown-item text-primary" href="admin/index.html"><i class="bi bi-speedometer2"></i> Panel de Administración</a>`;
      
      menuDropdown.insertBefore(adminItem, divider);
    }
  } else {
    // UI para usuario no autenticado
    container.innerHTML = `
      <div class="d-flex">
        <a href="login.html" class="btn btn-outline-light me-2">
          <i class="bi bi-box-arrow-in-right"></i> Ingresar
        </a>
        <a href="register.html" class="btn btn-primary">
          <i class="bi bi-person-plus"></i> Registrarse
        </a>
      </div>
    `;
  }
}

// Validar sesión de usuario
async function validateUserSession() {
  try {
    // Verificar token con la API
    await userApi.validateToken();
  } catch (error) {
    console.error('Error al validar sesión:', error);
    
    // Token inválido, cerrar sesión
    logout();
  }
}

// Cerrar sesión
function logout() {
  // Limpiar datos de sesión
  userApi.logout();
  localStorage.removeItem(Config.storage.userKey);
  
  // Redireccionar a la página principal
  window.location.href = 'index.html';
}