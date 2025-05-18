const getBaseApiUrl = function() {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname; // Esto será 192.168.100.3 cuando accedas desde esa IP
    const port = '3003'; // Mantener el puerto específico para la API de usuarios
    
    return `${protocol}//${hostname}:${port}/api`;
};

const USER_API_URL = getBaseApiUrl();

class UserApiClient {
  constructor() {
    this.baseUrl = USER_API_URL;
    this.token = localStorage.getItem('userAuthToken');
  }

  // Método para actualizar el token (después de login o registro)
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('userAuthToken', token);
    } else {
      localStorage.removeItem('userAuthToken');
    }
  }

  // Método para obtener headers con autenticación
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Método genérico para hacer peticiones
  async fetch(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const fetchOptions = {
      ...options,
      headers: this.getHeaders(),
    };

    try {
      const response = await fetch(url, fetchOptions);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error en la petición a la API de usuarios');
      }
      
      return data;
    } catch (error) {
      console.error('Error API de usuarios:', error);
      throw error;
    }
  }

  // MÉTODOS DE AUTENTICACIÓN
  
  // Login de usuario
  async login(email, password) {
    return this.fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }
  
  // Registro de usuario
  async register(userData) {
    return this.fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }
  
  // Recuperar contraseña
  async forgotPassword(email) {
    return this.fetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }
  
  // Restablecer contraseña
  async resetPassword(token, newPassword) {
    return this.fetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
  }
  
  // Validar token (verificar si está logueado)
  async validateToken() {
    return this.fetch('/auth/validate-token');
  }
  
  // MÉTODOS DE USUARIOS
  
  // Obtener todos los usuarios (solo admin)
  async getAllUsers() {
    return this.fetch('/usuarios');
  }
  
  // Obtener usuario por ID
  async getUserById(id) {
    return this.fetch(`/usuarios/${id}`);
  }
  
  // Actualizar usuario
  async updateUser(id, userData) {
    return this.fetch(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }
  
  // Cambiar contraseña
  async changePassword(id, currentPassword, newPassword) {
    return this.fetch(`/usuarios/${id}/change-password`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }
  
  // Eliminar usuario (solo admin)
  async deleteUser(id) {
    return this.fetch(`/usuarios/${id}`, {
      method: 'DELETE'
    });
  }
  
  // MÉTODOS DE DIRECCIONES
  
  // Obtener direcciones de un usuario
  async getUserAddresses(userId) {
    return this.fetch(`/direcciones/usuario/${userId}`);
  }
  
  // Obtener dirección por ID
  async getAddressById(id) {
    return this.fetch(`/direcciones/${id}`);
  }
  
  // Crear dirección
  async createAddress(addressData) {
    return this.fetch('/direcciones', {
      method: 'POST',
      body: JSON.stringify(addressData)
    });
  }
  
  // Actualizar dirección
  async updateAddress(id, addressData) {
    return this.fetch(`/direcciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(addressData)
    });
  }
  
  // Eliminar dirección
  async deleteAddress(id) {
    return this.fetch(`/direcciones/${id}`, {
      method: 'DELETE'
    });
  }
  
  // Establecer dirección como predeterminada
  async setDefaultAddress(id) {
    return this.fetch(`/direcciones/${id}/predeterminada`, {
      method: 'PATCH'
    });
  }
  
  // Método para cerrar sesión (solo en cliente)
  logout() {
    this.setToken(null);
    localStorage.removeItem('currentUser');
  }
}

// Exportar una instancia única
const userApi = new UserApiClient();

// Exponer globalmente para uso en scripts no-módulos
window.userApi = userApi;