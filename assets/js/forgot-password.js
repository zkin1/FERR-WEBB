import userApi from './userApi.js';

document.addEventListener('DOMContentLoaded', () => {
  // Formulario de solicitud de recuperación
  const forgotForm = document.getElementById('forgotPasswordForm');
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Mostrar indicador de carga
      const submitBtn = forgotForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';
      
      // Limpiar mensajes previos
      const errorDiv = document.getElementById('forgotError');
      if (errorDiv) errorDiv.style.display = 'none';
      
      try {
        const email = document.getElementById('email').value;
        
        // Llamar a la API
        await userApi.forgotPassword(email);
        
        // Mostrar mensaje de éxito
        const successDiv = document.getElementById('forgotSuccess');
        if (successDiv) {
          successDiv.textContent = 'Si el email existe en nuestra base de datos, recibirás un correo con instrucciones para recuperar tu contraseña.';
          successDiv.style.display = 'block';
        }
        
        // Ocultar formulario
        forgotForm.style.display = 'none';
      } catch (error) {
        console.error('Error al solicitar recuperación:', error);
        
        if (errorDiv) {
          errorDiv.textContent = error.message || 'Error al procesar tu solicitud. Intenta nuevamente más tarde.';
          errorDiv.style.display = 'block';
        }
      } finally {
        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }
  
  // Formulario de restablecimiento de contraseña
  const resetForm = document.getElementById('resetPasswordForm');
  if (resetForm) {
    // Obtener token de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    // Si no hay token, mostrar error
    if (!token) {
      const errorDiv = document.getElementById('resetError');
      if (errorDiv) {
        errorDiv.textContent = 'Token inválido o no proporcionado. Solicita un nuevo enlace de recuperación.';
        errorDiv.style.display = 'block';
      }
      resetForm.style.display = 'none';
      return;
    }
    
    // Procesar formulario
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Mostrar indicador de carga
      const submitBtn = resetForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';
      
      // Limpiar mensajes previos
      const errorDiv = document.getElementById('resetError');
      if (errorDiv) errorDiv.style.display = 'none';
      
      try {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validar contraseñas
        if (newPassword !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden');
        }
        
        // Llamar a la API
        await userApi.resetPassword(token, newPassword);
        
        // Mostrar mensaje de éxito
        const successDiv = document.getElementById('resetSuccess');
        if (successDiv) {
          successDiv.textContent = 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.';
          successDiv.style.display = 'block';
        }
        
        // Ocultar formulario
        resetForm.style.display = 'none';
        
        // Añadir botón para ir a login
        const loginButton = document.createElement('a');
        loginButton.href = 'login.html';
        loginButton.className = 'btn btn-primary mt-3';
        loginButton.textContent = 'Ir a iniciar sesión';
        
        const container = resetForm.parentElement;
        container.appendChild(loginButton);
      } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        
        if (errorDiv) {
          errorDiv.textContent = error.message || 'Error al restablecer la contraseña. Intenta nuevamente o solicita un nuevo enlace.';
          errorDiv.style.display = 'block';
        }
        
        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }
});