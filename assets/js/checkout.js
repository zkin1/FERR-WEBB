const API_URL = '/api';
const TOKEN_KEY = 'auth_token';

// Obtener token de autenticación
function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY);
}

// Verificar si el usuario está autenticado
function isAuthenticated() {
    return !!getAuthToken();
}

// Estado del checkout
let checkoutState = {
    loading: false,
    error: null,
    carritoId: null,
    orderData: null
};

// Inicializar checkout
async function initCheckout() {
    updateCheckoutUI({ loading: true });
    
    try {
        // Redirigir al login si no está autenticado
        if (!isAuthenticated()) {
            window.location.href = 'login.html?redirect=checkout.html';
            return;
        }
        
        // Obtener carrito activo
        const carrito = await fetchCarritoActivo();
        
        if (!carrito || !carrito.items || carrito.items.length === 0) {
            // Redirigir si el carrito está vacío
            alert('Su carrito está vacío');
            window.location.href = 'index.html';
            return;
        }
        
        // Guardar ID del carrito
        checkoutState.carritoId = carrito.id;
        
        // Renderizar resumen del carrito
        renderCartSummary(carrito);
        
        // Cargar datos del usuario
        await loadUserData();
    } catch (error) {
        console.error('Error al inicializar checkout:', error);
        updateCheckoutUI({ error: 'Error al cargar los datos del checkout' });
    } finally {
        updateCheckoutUI({ loading: false });
    }
}

// Obtener carrito activo
async function fetchCarritoActivo() {
    try {
        const response = await fetch(`${API_URL}/carrito/activo`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener el carrito');
        }
        
        const data = await response.json();
        
        // Formatear respuesta
        const formattedCart = {
            id: data.carrito.id,
            items: data.items.map(item => ({
                id: item.producto_id,
                nombre: item.producto.nombre,
                precio: item.precio_unitario,
                cantidad: item.cantidad,
                imagen: item.producto.imagen_principal || 'assets/images/productos/default.jpg',
                subtotal: item.subtotal
            })),
            total: data.carrito.total
        };
        
        return formattedCart;
    } catch (error) {
        console.error('Error al obtener carrito activo:', error);
        throw error;
    }
}

// Cargar datos del usuario
async function loadUserData() {
    try {
        // Aquí se cargarían los datos del usuario desde el servidor
        // Por ahora, solo cargaremos los datos almacenados localmente o
        // mostraremos un formulario vacío
        
        const userData = JSON.parse(localStorage.getItem('user_data')) || {};
        
        // Llenar el formulario con los datos del usuario
        const form = document.getElementById('checkout-form');
        if (form) {
            for (const key in userData) {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) {
                    input.value = userData[key];
                }
            }
        }
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
    }
}

// Renderizar resumen del carrito
function renderCartSummary(cart) {
    const summaryContainer = document.getElementById('cart-summary');
    
    if (!summaryContainer) return;
    
    let html = '<h3>Resumen del pedido</h3>';
    
    // Listar productos
    html += '<ul class="cart-summary-list">';
    cart.items.forEach(item => {
        html += `
            <li>
                <span class="product-name">${item.nombre}</span>
                <span class="product-qty">x${item.cantidad}</span>
                <span class="product-price">$${formatPrice(item.subtotal)}</span>
            </li>
        `;
    });
    html += '</ul>';
    
    // Mostrar total
    html += `
        <div class="cart-summary-total">
            <span>Total</span>
            <span>$${formatPrice(cart.total)}</span>
        </div>
    `;
    
    summaryContainer.innerHTML = html;
}

// Procesar formulario de checkout
async function processCheckout(formData) {
    updateCheckoutUI({ loading: true });
    
    try {
        // Guardar datos del formulario para futuras compras
        localStorage.setItem('user_data', JSON.stringify(formData));
        
        // Procesar el carrito
        const response = await fetch(`${API_URL}/carrito/${checkoutState.carritoId}/procesar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al procesar el pedido');
        }
        
        const orderData = await response.json();
        checkoutState.orderData = orderData;
        
        // Preparación para WebPay
        // Este es el punto donde se integraría con WebPay
        // Por ahora, simularemos un pago exitoso
        
        // Redirigir a página de éxito
        redirectToSuccessPage(orderData);
    } catch (error) {
        console.error('Error al procesar el pedido:', error);
        updateCheckoutUI({ error: error.message || 'Error al procesar el pedido' });
    } finally {
        updateCheckoutUI({ loading: false });
    }
}

// Redirigir a página de éxito
function redirectToSuccessPage(orderData) {
    // Guardar datos temporalmente
    sessionStorage.setItem('order_data', JSON.stringify(orderData));
    
    // Redirigir
    window.location.href = 'order-success.html';
}

// Formatear precios
function formatPrice(price) {
    return new Intl.NumberFormat('es-CL').format(price);
}

// Actualizar UI de checkout
function updateCheckoutUI({ loading, error }) {
    if (loading !== undefined) {
        checkoutState.loading = loading;
        
        // Mostrar/ocultar loader
        const loaders = document.querySelectorAll('.checkout-loader');
        loaders.forEach(loader => {
            loader.style.display = loading ? 'block' : 'none';
        });
        
        // Desactivar/activar botones durante carga
        const buttons = document.querySelectorAll('.checkout-btn');
        buttons.forEach(button => {
            button.disabled = loading;
        });
    }
    
    if (error !== undefined) {
        checkoutState.error = error;
        
        // Mostrar mensaje de error si existe
        if (error) {
            const errorContainer = document.getElementById('checkout-error');
            if (errorContainer) {
                errorContainer.textContent = error;
                errorContainer.style.display = 'block';
            }
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar checkout si estamos en la página de checkout
    if (window.location.pathname.includes('checkout.html')) {
        // Añadir loader y contenedor de errores
        const checkoutContainer = document.querySelector('.checkout-container');
        if (checkoutContainer) {
            checkoutContainer.insertAdjacentHTML('afterbegin', '<div class="checkout-loader" style="display:none;"><p>Procesando...</p></div>');
            checkoutContainer.insertAdjacentHTML('afterbegin', '<div id="checkout-error" style="display:none;" class="alert alert-danger"></div>');
        }
        
        // Inicializar checkout
        initCheckout();
        
        // Añadir evento al formulario de checkout
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Recoger datos del formulario
                const formData = {};
                const formElements = this.elements;
                
                for (let i = 0; i < formElements.length; i++) {
                    const element = formElements[i];
                    if (element.name && element.value) {
                        formData[element.name] = element.value;
                    }
                }
                
                // Procesar el checkout
                processCheckout(formData);
            });
        }
    }
    
    // Inicializar página de éxito si estamos en ella
    if (window.location.pathname.includes('order-success.html')) {
        const orderData = JSON.parse(sessionStorage.getItem('order_data'));
        
        // Mostrar detalles del pedido
        const orderDetailsContainer = document.getElementById('order-details');
        if (orderDetailsContainer && orderData) {
            orderDetailsContainer.innerHTML = `
                <p>¡Su pedido se ha procesado correctamente!</p>
                <p>Número de pedido: <strong>${orderData.carritoId}</strong></p>
                <p>Un nuevo carrito ha sido creado para usted.</p>
                <a href="index.html" class="btn">Volver a la tienda</a>
            `;
        }
    }
});