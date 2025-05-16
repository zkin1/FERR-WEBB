const CART_STORAGE_KEY = 'carrito';

// Inicializar carrito
function initCart() {
    return getCartFromStorage();
}

// Obtener carrito desde localStorage
function getCartFromStorage() {
    try {
        const cartData = localStorage.getItem(CART_STORAGE_KEY);
        if (!cartData) {
            return { items: [], total: 0 };
        }
        return JSON.parse(cartData);
    } catch (error) {
        console.error('Error al leer carrito desde localStorage:', error);
        return { items: [], total: 0 };
    }
}

// Guardar carrito en localStorage
function saveCartToStorage(cart) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        console.log('Carrito guardado en localStorage');
    } catch (error) {
        console.error('Error al guardar carrito en localStorage:', error);
    }
}

// Añadir producto al carrito
function addToCart(product) {
    console.log('añadiendo al carrito:', product);
    
    // Obtener carrito actual
    let cart = getCartFromStorage();
    
    // Verificar si el producto ya existe
    const existingItemIndex = cart.items.findIndex(item => item.id === product.id);
    
    if (existingItemIndex >= 0) {
        // Actualizar cantidad si ya existe
        cart.items[existingItemIndex].cantidad += product.cantidad || 1;
        cart.items[existingItemIndex].subtotal = cart.items[existingItemIndex].precio * cart.items[existingItemIndex].cantidad;
    } else {
        // Asegurarse de que tiene una cantidad
        product.cantidad = product.cantidad || 1;
        
        // Añadir nuevo producto
        cart.items.push({
            ...product,
            subtotal: product.precio * product.cantidad
        });
    }
    
    // Recalcular total
    cart.total = cart.items.reduce((sum, item) => sum + (item.subtotal || item.precio * item.cantidad), 0);
    
    // Guardar en localStorage
    saveCartToStorage(cart);
    
    // Actualizar contador del carrito
    updateCartCount();
    
    // Mostrar notificación
    showToast('Producto agregado al carrito', 'success');
    
    return cart;
}

// Eliminar producto del carrito
function removeFromCart(productId) {
    // Obtener carrito actual
    let cart = getCartFromStorage();
    
    // Filtrar los items para eliminar el producto
    cart.items = cart.items.filter(item => item.id !== productId);
    
    // Recalcular total
    cart.total = cart.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    // Guardar en localStorage
    saveCartToStorage(cart);
    
    // Actualizar contador del carrito
    updateCartCount();
    
    // Mostrar notificación
    showToast('Producto eliminado del carrito', 'info');
    
    return cart;
}

// Actualizar cantidad de un producto
function updateQuantity(productId, cantidad) {
    if (cantidad <= 0) {
        return removeFromCart(productId);
    }
    
    // Obtener carrito actual
    let cart = getCartFromStorage();
    
    // Encontrar el producto en el carrito
    const itemIndex = cart.items.findIndex(item => item.id === productId);
    
    if (itemIndex >= 0) {
        // Actualizar la cantidad
        cart.items[itemIndex].cantidad = cantidad;
        cart.items[itemIndex].subtotal = cart.items[itemIndex].precio * cantidad;
        
        // Recalcular total
        cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
        
        // Guardar en localStorage
        saveCartToStorage(cart);
        
        // Actualizar contador del carrito
        updateCartCount();
    }
    
    return cart;
}

// Vaciar carrito
function clearCart() {
    // Crear carrito vacío
    const emptyCart = { items: [], total: 0 };
    
    // Guardar en localStorage
    saveCartToStorage(emptyCart);
    
    // Actualizar contador del carrito
    updateCartCount();
    
    // Mostrar notificación
    showToast('Carrito vaciado', 'info');
    
    return emptyCart;
}

// Actualizar contador del carrito en la interfaz
function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    
    if (cartCount) {
        let cart = getCartFromStorage();
        // Calcular cantidad total de productos
        const itemCount = cart.items.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
        cartCount.textContent = itemCount;
        console.log('Contador de carrito actualizado:', itemCount);
    }
}

// Mostrar toast de notificación
function showToast(message, type = 'success') {
    // Verificar si Bootstrap está disponible
    if (typeof bootstrap === 'undefined') {
        console.warn('Bootstrap no está disponible para mostrar toast');
        return;
    }
    
    // Crear toast container si no existe
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Crear el toast
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    let icon = 'check-circle';
    if (type === 'danger') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    if (type === 'info') icon = 'info-circle';
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${icon} me-2"></i>${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Inicializar y mostrar el toast
    const bsToast = new bootstrap.Toast(toast, {
        delay: 3000
    });
    bsToast.show();
    
    // Eliminar el toast después de ocultarse
    toast.addEventListener('hidden.bs.toast', function() {
        this.remove();
    });
}

// Formatear precios
function formatPrice(price) {
    return new Intl.NumberFormat('es-CL').format(price);
}

// Renderizar carrito en la página de carrito
function renderCart() {
    console.log('Renderizando carrito...');
    
    const cartContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const cartSubtotalElement = document.getElementById('cart-subtotal');
    
    if (!cartContainer) {
        console.error('No se encontró el contenedor del carrito (cart-items)');
        return;
    }
    
    try {
        // Obtener carrito desde localStorage
        let cart = getCartFromStorage();
        console.log('Carrito obtenido desde localStorage:', cart);
        
        // Limpiar el contenedor
        cartContainer.innerHTML = '';
        
        if (!cart.items || cart.items.length === 0) {
            // Mostrar mensaje si el carrito está vacío
            cartContainer.innerHTML = `
                <div class="empty-cart">
                    <p>Tu carrito está vacío</p>
                    <a href="index.html" class="btn btn-primary">Ir a la tienda</a>
                </div>
            `;
            
            if (cartTotalElement) {
                cartTotalElement.textContent = '$0';
            }
            
            if (cartSubtotalElement) {
                cartSubtotalElement.textContent = '$0';
            }
        } else {
            // Crear tabla del carrito
            const table = document.createElement('table');
            table.className = 'cart-table';
            
            // Cabecera de la tabla
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Precio</th>
                        <th>Cantidad</th>
                        <th>Subtotal</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="cart-items-body"></tbody>
            `;
            
            cartContainer.appendChild(table);
            
            const tbody = document.getElementById('cart-items-body');
            
            if (!tbody) {
                console.error('No se pudo crear el tbody');
                return;
            }
            
            // Añadir filas para cada producto
            cart.items.forEach(item => {
                const tr = document.createElement('tr');
                
                // Asegurarse de que la imagen existe
                const imagenUrl = item.imagen || '/assets/images/productos/default.jpg';
                
                tr.innerHTML = `
                    <td class="product-info">
                        <img src="${imagenUrl}" alt="${item.nombre}" onerror="this.src='/assets/images/productos/default.jpg'">
                        <div>
                            <h4>${item.nombre}</h4>
                        </div>
                    </td>
                    <td class="price">$${formatPrice(item.precio)}</td>
                    <td class="quantity">
                        <div class="quantity-control">
                            <button class="quantity-btn dec cart-btn" data-id="${item.id}">-</button>
                            <input type="number" value="${item.cantidad}" min="1" class="quantity-input" data-id="${item.id}">
                            <button class="quantity-btn inc cart-btn" data-id="${item.id}">+</button>
                        </div>
                    </td>
                    <td class="subtotal">$${formatPrice(item.precio * item.cantidad)}</td>
                    <td class="actions">
                        <button class="remove-btn cart-btn" data-id="${item.id}">🗑️</button>
                    </td>
                `;
                
                tbody.appendChild(tr);
            });
            
            // Asegurarse de que hay valores numéricos
            const cartTotal = cart.total || cart.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
            
            // Actualizar total
            if (cartTotalElement) {
                cartTotalElement.textContent = `$${formatPrice(cartTotal)}`;
            }
            
            // Actualizar subtotal
            if (cartSubtotalElement) {
                cartSubtotalElement.textContent = `$${formatPrice(cartTotal)}`;
            }
            
            // Añadir botones de acción al final del carrito
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'cart-actions';
            actionsDiv.innerHTML = `
                <button id="clear-cart" class="btn btn-secondary cart-btn">Vaciar carrito</button>
                <button id="checkout-btn" class="btn btn-primary cart-btn">Proceder al pago</button>
            `;
            
            cartContainer.appendChild(actionsDiv);
            
            // Añadir eventos a los botones
            addCartEventListeners();
        }
    } catch (error) {
        console.error('Error al renderizar carrito:', error);
        cartContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error al cargar el carrito. Por favor, intenta de nuevo más tarde.
            </div>
        `;
    }
}

// Añadir eventos a los elementos del carrito
function addCartEventListeners() {
    console.log('Configurando eventos del carrito...');
    
    // Botones para decrementar cantidad
    const decButtons = document.querySelectorAll('.quantity-btn.dec');
    decButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.dataset.id;
            const input = document.querySelector(`.quantity-input[data-id="${itemId}"]`);
            let cantidad = parseInt(input.value) - 1;
            if (cantidad < 1) cantidad = 1;
            
            updateQuantity(itemId, cantidad);
            renderCart();
        });
    });
    
    // Botones para incrementar cantidad
    const incButtons = document.querySelectorAll('.quantity-btn.inc');
    incButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.dataset.id;
            const input = document.querySelector(`.quantity-input[data-id="${itemId}"]`);
            let cantidad = parseInt(input.value) + 1;
            
            updateQuantity(itemId, cantidad);
            renderCart();
        });
    });
    
    // Inputs de cantidad
    const quantityInputs = document.querySelectorAll('.quantity-input');
    quantityInputs.forEach(input => {
        input.addEventListener('change', function() {
            const itemId = this.dataset.id;
            let cantidad = parseInt(this.value);
            if (cantidad < 1) cantidad = 1;
            
            updateQuantity(itemId, cantidad);
            renderCart();
        });
    });
    
    // Botones para eliminar producto
    const removeButtons = document.querySelectorAll('.remove-btn');
    removeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.dataset.id;
            
            removeFromCart(itemId);
            renderCart();
        });
    });
    
    // Botón para vaciar carrito
    const clearCartBtn = document.getElementById('clear-cart');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function() {
            if (confirm('¿Está seguro que desea vaciar el carrito?')) {
                clearCart();
                renderCart();
            }
        });
    }
    
    // Botón para proceder al pago
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            // Redirigir a la página de checkout
            window.location.href = 'checkout.html';
        });
    }
}

// Código a ejecutar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado - carrito.js simplificado');
    
    // Asegurar que las funciones están disponibles globalmente
    window.addToCart = addToCart;
    window.updateCartCount = updateCartCount;
    window.removeFromCart = removeFromCart;
    window.updateQuantity = updateQuantity;
    window.clearCart = clearCart;
    window.showToast = showToast;
    window.formatPrice = formatPrice;
    window.renderCart = renderCart;
    
    // Actualizar contador del carrito
    updateCartCount();
    
    // Establecer evento para botones de agregar al carrito 
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', function() {
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
    
    // Renderizar carrito si estamos en la página de carrito
    if (window.location.pathname.includes('cart.html')) {
        console.log('Estamos en la página del carrito, renderizando...');
        renderCart();
    }
});

// Función de diagnóstico - útil para depuración
function diagnoseCart() {
    console.log('======= DIAGNÓSTICO DEL CARRITO =======');
    
    try {
        // Verificar si localStorage está disponible
        if (typeof localStorage === 'undefined') {
            console.error('localStorage no está disponible en este navegador');
            return;
        }
        
        // Obtener datos brutos del carrito
        const rawCartData = localStorage.getItem(CART_STORAGE_KEY);
        console.log('Datos brutos del carrito:', rawCartData);
        
        // Intentar parsear los datos
        let parsedCart;
        try {
            parsedCart = JSON.parse(rawCartData);
            console.log('Datos parseados correctamente:', parsedCart);
        } catch (error) {
            console.error('Error al parsear datos del carrito:', error);
            return;
        }
        
        // Verificar estructura del carrito
        if (!parsedCart) {
            console.log('El carrito está vacío o no existe');
            return;
        }
        
        console.log('Estructura del carrito:');
        console.log('- items:', Array.isArray(parsedCart.items) ? `Array con ${parsedCart.items.length} elementos` : 'No es un array o no existe');
        console.log('- total:', parsedCart.total);
        
        // Verificar elementos del carrito
        if (Array.isArray(parsedCart.items) && parsedCart.items.length > 0) {
            console.log('Primer elemento del carrito:', parsedCart.items[0]);
            
            // Verificar campos requeridos
            const requiredFields = ['id', 'nombre', 'precio', 'cantidad'];
            const missingFields = [];
            
            requiredFields.forEach(field => {
                if (!parsedCart.items[0].hasOwnProperty(field)) {
                    missingFields.push(field);
                }
            });
            
            if (missingFields.length > 0) {
                console.warn('Campos faltantes en el primer elemento:', missingFields.join(', '));
            } else {
                console.log('El primer elemento tiene todos los campos requeridos');
            }
        }
        
    } catch (error) {
        console.error('Error durante el diagnóstico:', error);
    }
    
    console.log('======= FIN DEL DIAGNÓSTICO =======');
}

// Exportar funciones para que estén disponibles globalmente
window.addToCart = addToCart;
window.updateCartCount = updateCartCount;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.clearCart = clearCart;
window.showToast = showToast;
window.formatPrice = formatPrice;
window.renderCart = renderCart;
window.diagnoseCart = diagnoseCart; // Función de utilidad para depuración

// Confirmar que las funciones están disponibles globalmente
console.log('carrito.js - Funciones globales definidas correctamente:');
console.log('- addToCart:', typeof window.addToCart === 'function' ? '✓' : '✗');
console.log('- updateCartCount:', typeof window.updateCartCount === 'function' ? '✓' : '✗');
console.log('- renderCart:', typeof window.renderCart === 'function' ? '✓' : '✗');