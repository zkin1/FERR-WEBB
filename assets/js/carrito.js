const CART_STORAGE_KEY = 'carrito';
const USER_CART_PREFIX = 'user_cart_';
const AUTH_TOKEN_KEY = 'userAuthToken';
const USER_DATA_KEY = 'currentUser';



// Variables globales
let isInitialized = false;

// Verificar si el usuario está autenticado
function isAuthenticated() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const userData = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '{}');
    return token && Object.keys(userData).length > 0;
}

// Obtener ID del usuario actual
function getCurrentUserId() {
    try {
        const userData = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '{}');
        return userData.id || userData.userId || null;
    } catch (error) {
        console.error('Error al obtener ID de usuario:', error);
        return null;
    }
}

// Generar clave de almacenamiento específica por usuario
function getUserCartKey() {
    const userId = getCurrentUserId();
    return userId ? `${USER_CART_PREFIX}${userId}` : CART_STORAGE_KEY;
}

// Inicializar carrito
function initCart() {
    if (!isInitialized) {
        console.log('Inicializando carrito...');
        
        // Configurar listener para cambios de autenticación
        window.addEventListener('auth_state_changed', handleAuthChange);
        
        // Marcar como inicializado
        isInitialized = true;
    }
    
    return getCartFromStorage();
}

// Manejar cambios en el estado de autenticación
function handleAuthChange(event) {
    console.log('Cambio en estado de autenticación detectado:', event.detail?.state);
    
    if (event.detail?.state === 'logout') {
        // Limpiar el carrito en localStorage al cerrar sesión
        localStorage.removeItem(CART_STORAGE_KEY);
        updateCartCount();
    } else if (event.detail?.state === 'login') {
        // Cargar el carrito del usuario al iniciar sesión
        updateCartCount();
    }
}

// Obtener carrito desde localStorage
function getCartFromStorage() {
    try {
        // Determinar qué clave usar según si hay un usuario autenticado
        const storageKey = getUserCartKey();
        
        const cartData = localStorage.getItem(storageKey);
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
        // Determinar qué clave usar según si hay un usuario autenticado
        const storageKey = getUserCartKey();
        
        localStorage.setItem(storageKey, JSON.stringify(cart));
        console.log('Carrito guardado en localStorage con clave:', storageKey);
    } catch (error) {
        console.error('Error al guardar carrito en localStorage:', error);
    }
}

// Añadir producto al carrito
function addToCart(product) {
    // Verificar si el usuario está autenticado
    if (!isAuthenticated()) {
        showToast('Debes iniciar sesión para agregar productos al carrito', 'warning');
        
        // Redirigir al login después de un breve retraso
        setTimeout(() => {
            window.location.href = '/pages/login.html?redirect=' + encodeURIComponent(window.location.href);
        }, 2000);
        
        return null;
    }
    
    console.log('Añadiendo al carrito para usuario:', getCurrentUserId(), product);
    
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
    // Verificar si el usuario está autenticado
    if (!isAuthenticated()) {
        showToast('Debes iniciar sesión para modificar el carrito', 'warning');
        return null;
    }
    
    console.log('Intentando eliminar producto con ID:', productId);
    
    // Obtener carrito actual
    let cart = getCartFromStorage();
    
    // Guardar la cantidad original de elementos
    const originalItemCount = cart.items.length;
    
    // Convertir productId a string para asegurar consistencia en la comparación
    const productIdString = String(productId);
    
    // Filtrar los items para eliminar el producto - asegurando comparación consistente
    cart.items = cart.items.filter(item => {
        const itemId = String(item.id);
        const shouldKeep = itemId !== productIdString;
        if (!shouldKeep) {
            console.log('Eliminando producto:', item.nombre);
        }
        return shouldKeep;
    });
    
    // Verificar si realmente se eliminó algún producto
    if (cart.items.length === originalItemCount) {
        console.warn('No se encontró ningún producto con ID:', productId);
        // Buscar con identidad estricta por si el tipo es el problema
        const itemIndex = cart.items.findIndex(item => item.id == productId);
        if (itemIndex >= 0) {
            console.log('Producto encontrado con comparación débil, eliminando manualmente');
            cart.items.splice(itemIndex, 1);
        } else {
            console.error('No se pudo encontrar el producto ni siquiera con comparación débil');
        }
    }
    
    // Recalcular total usando subtotal si está disponible o multiplicando precio por cantidad
    cart.total = cart.items.reduce((sum, item) => {
        if (typeof item.subtotal === 'number') {
            return sum + item.subtotal;
        } else {
            return sum + (item.precio * item.cantidad);
        }
    }, 0);
    
    // Guardar en localStorage
    saveCartToStorage(cart);
    
    // Actualizar contador del carrito
    updateCartCount();
    
    // Mostrar notificación
    showToast('Producto eliminado del carrito', 'info');
    
    // Si estamos en la página de carrito, refrescar la vista
    if (window.location.pathname.includes('cart.html')) {
        renderCart();
    }
    
    return cart;
}

// Actualizar cantidad de un producto
function updateQuantity(productId, cantidad) {
    // Verificar si el usuario está autenticado
    if (!isAuthenticated()) {
        showToast('Debes iniciar sesión para modificar el carrito', 'warning');
        return null;
    }
    
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
    // Verificar si el usuario está autenticado
    if (!isAuthenticated()) {
        showToast('Debes iniciar sesión para modificar el carrito', 'warning');
        return null;
    }
    
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
        if (isAuthenticated()) {
            // Si está autenticado, mostrar cantidad real
            let cart = getCartFromStorage();
            // Calcular cantidad total de productos
            const itemCount = cart.items.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
            cartCount.textContent = itemCount;
            console.log('Contador de carrito actualizado:', itemCount);
        } else {
            // Si no está autenticado, mostrar 0
            cartCount.textContent = '0';
        }
    }
}

// Mostrar toast de notificación
function showToast(message, type = 'success') {
    // Verificar si Bootstrap está disponible
    if (typeof bootstrap === 'undefined') {
        console.warn('Bootstrap no está disponible para mostrar toast');
        alert(message); // Fallback a alerta nativa
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
    
    // Verificar si el usuario está autenticado
    if (!isAuthenticated()) {
        cartContainer.innerHTML = `
            <div class="alert alert-warning" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Debes iniciar sesión para ver tu carrito.
                <div class="mt-3">
                    <a href="/pages/login.html?redirect=/cart.html" class="btn btn-primary">
                        <i class="fas fa-sign-in-alt me-2"></i> Iniciar sesión
                    </a>
                </div>
            </div>
        `;
        
        if (cartTotalElement) cartTotalElement.textContent = '$0';
        if (cartSubtotalElement) cartSubtotalElement.textContent = '$0';
        
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
    const checkoutBtn = document.getElementById('checkout-btn') || document.getElementById('checkout-button');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            // Verificar autenticación
            if (!isAuthenticated()) {
                showToast('Debes iniciar sesión para continuar con la compra', 'warning');
                
                setTimeout(() => {
                    // Guardar la URL actual para redireccionar después del login
                    window.location.href = '/pages/login.html?redirect=' + encodeURIComponent('/checkout.html');
                }, 1500);
                return;
            }
            
            // Verificar carrito
            const cart = getCartFromStorage();
            if (!cart.items || cart.items.length === 0) {
                showToast('No puedes proceder al pago con un carrito vacío', 'warning');
                return;
            }
            
            // Redirigir a checkout
            window.location.href = '/checkout.html';
        });
    }
}

// Función para verificar inventario
async function checkCartInventory(cart) {
    try {
        // Validar que existe el servicio
        if (!window.inventarioSoap || !window.inventarioSoap.getProductStock) {
            return true; // Si no hay servicio de inventario, continuar
        }
        
        // Verificar cada producto
        for (const item of cart.items) {
            const stockResult = await window.inventarioSoap.getProductStock(item.id);
            // Comprobar si hay suficiente stock
            const stockItems = stockResult.stockItems?.stockItem || [];
            const totalStock = stockItems.reduce((sum, stockItem) => sum + (stockItem.cantidad || 0), 0);
            
            if (totalStock < item.cantidad) {
                showToast(`No hay suficiente stock de: ${item.nombre}`, 'danger');
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error al verificar inventario:', error);
        return true; // En caso de error, permitir continuar
    }
}

// FUNCIÓN CORREGIDA: Configurar botones de checkout
function setupCheckoutButtons() {
    console.log('Configurando todos los botones de checkout');
    
    // Selectores válidos para CSS estándar (sin el :contains que es de jQuery)
    const checkoutButtons = document.querySelectorAll('.btn-primary[href*="pago"], #checkout-btn, #checkout-button, [id*="proceder"]');
    
    // Buscar también botones que contienen el texto "Proceder al pago" manualmente
    const allButtons = document.querySelectorAll('button, a.btn');
    const textButtons = Array.from(allButtons).filter(btn => 
        btn.textContent && (
            btn.textContent.trim().includes('Proceder al pago') || 
            btn.textContent.trim().includes('Proceder')
        )
    );
    
    // Combinar ambos conjuntos de botones
    const allCheckoutButtons = [...Array.from(checkoutButtons), ...textButtons];
    
    // Eliminar duplicados
    const uniqueButtons = [...new Set(allCheckoutButtons)];
    
    console.log('Botones de checkout encontrados:', uniqueButtons.length);
    
    // Añadir evento a cada botón
    uniqueButtons.forEach(button => {
        // Solo procesar si es un elemento válido
        if (!button || typeof button.addEventListener !== 'function') {
            return;
        }
        
        // Remover eventos existentes para evitar duplicidad
        const newButton = button.cloneNode(true);
        if (button.parentNode) {
            button.parentNode.replaceChild(newButton, button);
        }
        
        // Añadir nuevo evento
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Botón de checkout clickeado:', this);
            
            // Verificar autenticación
            if (!isAuthenticated()) {
                console.log('Usuario no autenticado, redirigiendo a login');
                showToast('Debes iniciar sesión para continuar con la compra', 'warning');
                
                setTimeout(() => {
                    // Guardar URL de checkout para redireccionar después del login
                    window.location.href = '/pages/login.html?redirect=' + encodeURIComponent('/checkout.html');
                }, 1000);
                return;
            }
            
            // Verificar carrito
            const cart = getCartFromStorage();
            if (!cart.items || cart.items.length === 0) {
                showToast('No puedes proceder al pago con un carrito vacío', 'warning');
                return;
            }
            
            // Redirigir a checkout
            console.log('Redirigiendo a checkout');
            window.location.href = '/checkout.html';
        });
    });
}

// Generar evento personalizado para notificar cambios de autenticación
function notifyAuthChange(state) {
    const event = new CustomEvent('auth_state_changed', {
        detail: { state: state }
    });
    window.dispatchEvent(event);
}

// Integración con sistema de cierre de sesión existente
// Monkey-patch del método logout para limpiar el carrito al cerrar sesión
if (window.logout) {
    const originalLogout = window.logout;
    window.logout = function() {
        // Notificar cambio de autenticación
        notifyAuthChange('logout');
        
        // Llamar a la función original
        return originalLogout.apply(this, arguments);
    };
    console.log('Función logout extendida para manejar carrito');
}

// Código a ejecutar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado - carrito.js con autenticación');
    
    // Asegurar que las funciones están disponibles globalmente
    window.addToCart = addToCart;
    window.updateCartCount = updateCartCount;
    window.removeFromCart = removeFromCart;
    window.updateQuantity = updateQuantity;
    window.clearCart = clearCart;
    window.showToast = showToast;
    window.formatPrice = formatPrice;
    window.renderCart = renderCart;
    
    // Inicializar sistema de carrito
    initCart();
    
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
    
    // Configurar botones de checkout en todas las páginas
    setupCheckoutButtons();
    
    // Solución específica para el botón con el candado
    configurarBotonCandado();
    
    // Custom hook para login exitoso
    // Esto es para sistemas que no disparan eventos al iniciar sesión
    if (window.location.pathname.includes('login.html') && window.location.search.includes('success=true')) {
        notifyAuthChange('login');
    }
    
    // Añadir debugging de botones
    debugBotones();
});

// Solución para botones de candado
function configurarBotonCandado() {
    // Buscar botones que tengan un ícono de candado o estén en el contenedor del resumen
    const lockButtons = document.querySelectorAll('button.proceder-pago-lock, a.proceder-pago-lock, .cart-summary button, button .fa-lock, a .fa-lock');
    
    if (lockButtons.length > 0) {
        console.log('Botones de candado encontrados:', lockButtons.length);
        
        lockButtons.forEach((btn, index) => {
            console.log(`Configurando botón candado ${index + 1}`);
            
            // Eliminar eventos previos
            const newBtn = btn.cloneNode(true);
            if (btn.parentNode) {
                btn.parentNode.replaceChild(newBtn, btn);
            }
            
            // Configurar nuevo evento
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Botón candado clickeado');
                
                // Verificar autenticación
                if (!isAuthenticated()) {
                    console.log('Usuario no autenticado, redirigiendo a login');
                    showToast('Debes iniciar sesión para continuar', 'warning');
                    
                    setTimeout(() => {
                        window.location.href = '/pages/login.html?redirect=' + encodeURIComponent('/checkout.html');
                    }, 1000);
                    return;
                }
                
                // Verificar carrito
                const cart = getCartFromStorage();
                if (!cart.items || cart.items.length === 0) {
                    showToast('El carrito está vacío', 'warning');
                    return;
                }
                
                // Redirigir a checkout
                window.location.href = '/checkout.html';
            });
        });
    } else {
        console.log('No se encontraron botones de candado');
    }
}

// Función de debugging para botones
function debugBotones() {
    console.log('=== DEBUGGER DE BOTONES ===');
    
    // Botones en página de carrito
    if (window.location.pathname.includes('cart.html') || window.location.href.includes('carrito')) {
        console.log('Página de carrito detectada, buscando botones de checkout');
        
        const allButtons = document.querySelectorAll('button, a.btn');
        console.log('Total de botones y enlaces:', allButtons.length);
        
        // Listar todos los botones para checkout
        const checkoutButtons = Array.from(allButtons).filter(btn => 
            btn.id === 'checkout-btn' || 
            btn.id === 'checkout-button' || 
            (btn.textContent && btn.textContent.includes('Proceder')) ||
            btn.classList.contains('btn-proceder-pago') ||
            btn.querySelector('.fa-lock')
        );
        
        console.log('Botones de checkout identificados:', checkoutButtons.length);
        
        checkoutButtons.forEach((btn, i) => {
            console.log(`Botón ${i+1}:`, {
                elemento: btn,
                id: btn.id || 'sin-id',
                clase: btn.className,
                texto: btn.textContent ? btn.textContent.trim() : 'sin-texto',
                tieneCandado: !!btn.querySelector('.fa-lock')
            });
        });
    }
    
    console.log('=== FIN DEBUGGER DE BOTONES ===');
}

// Esto añade la notificación de cambio de autenticación a las funciones existentes
document.addEventListener('login_success', function() {
    notifyAuthChange('login');
});

document.addEventListener('logout_success', function() {
    notifyAuthChange('logout');
});

// Función de diagnóstico - útil para depuración
function diagnoseCart() {
    console.log('======= DIAGNÓSTICO DEL CARRITO =======');
    
    try {
        // Verificar estado de autenticación
        const isLoggedIn = isAuthenticated();
        console.log('Usuario autenticado:', isLoggedIn);
        console.log('ID de usuario:', getCurrentUserId());
        
        // Verificar si localStorage está disponible
        if (typeof localStorage === 'undefined') {
            console.error('localStorage no está disponible en este navegador');
            return;
        }
        
        // Obtener clave específica del usuario
        const userCartKey = getUserCartKey();
        console.log('Clave de carrito:', userCartKey);
        
        // Obtener datos brutos del carrito
        const rawCartData = localStorage.getItem(userCartKey);
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
window.notifyAuthChange = notifyAuthChange; // Para notificar cambios de autenticación
window.checkCartInventory = checkCartInventory; // Exponer función de verificación de inventario

// Confirmar que las funciones están disponibles globalmente
console.log('carrito.js - Funciones globales definidas correctamente:');
console.log('- addToCart:', typeof window.addToCart === 'function' ? '✓' : '✗');
console.log('- updateCartCount:', typeof window.updateCartCount === 'function' ? '✓' : '✗');
console.log('- renderCart:', typeof window.renderCart === 'function' ? '✓' : '✗');