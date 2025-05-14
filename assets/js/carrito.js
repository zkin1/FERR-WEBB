// Inicializar carrito desde localStorage
function initCart() {
    return JSON.parse(localStorage.getItem('carrito')) || { items: [], total: 0 };
}

// Guardar carrito en localStorage
function saveCart(cart) {
    localStorage.setItem('carrito', JSON.stringify(cart));
}

// Obtener carrito
function getCart() {
    return initCart();
}

// Añadir producto al carrito
function addToCart(product) {
    let cart = initCart();
    
    // Verificar si el producto ya existe en el carrito
    const existingItemIndex = cart.items.findIndex(item => item.id === product.id);
    
    if (existingItemIndex >= 0) {
        // Actualizar cantidad si ya existe
        cart.items[existingItemIndex].cantidad += product.cantidad;
    } else {
        // Añadir nuevo producto al carrito
        cart.items.push(product);
    }
    
    // Recalcular total
    updateCartTotal(cart);
    
    // Guardar en localStorage
    saveCart(cart);
    
    // Actualizar contador del carrito en la interfaz
    updateCartCount();
}

// Eliminar producto del carrito
function removeFromCart(productId) {
    let cart = initCart();
    
    // Filtrar los items para eliminar el producto
    cart.items = cart.items.filter(item => item.id !== productId);
    
    // Recalcular total
    updateCartTotal(cart);
    
    // Guardar en localStorage
    saveCart(cart);
    
    // Actualizar contador del carrito en la interfaz
    updateCartCount();
    
    return cart;
}

// Actualizar cantidad de un producto
function updateQuantity(productId, cantidad) {
    let cart = initCart();
    
    // Encontrar el producto en el carrito
    const itemIndex = cart.items.findIndex(item => item.id === productId);
    
    if (itemIndex >= 0) {
        if (cantidad <= 0) {
            // Si la cantidad es 0 o menor, eliminar el producto
            return removeFromCart(productId);
        } else {
            // Actualizar la cantidad
            cart.items[itemIndex].cantidad = cantidad;
        }
        
        // Recalcular total
        updateCartTotal(cart);
        
        // Guardar en localStorage
        saveCart(cart);
    }
    
    // Actualizar contador del carrito en la interfaz
    updateCartCount();
    
    return cart;
}

// Vaciar carrito
function clearCart() {
    // Crear carrito vacío
    const emptyCart = { items: [], total: 0 };
    
    // Guardar en localStorage
    saveCart(emptyCart);
    
    // Actualizar contador del carrito en la interfaz
    updateCartCount();
    
    return emptyCart;
}

// Actualizar total del carrito
function updateCartTotal(cart) {
    cart.total = cart.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
}

// Actualizar contador del carrito en la interfaz
function updateCartCount() {
    const cart = initCart();
    const cartCount = document.getElementById('cart-count');
    
    if (cartCount) {
        // Calcular cantidad total de productos
        const itemCount = cart.items.reduce((sum, item) => sum + item.cantidad, 0);
        cartCount.textContent = itemCount;
    }
}

// Renderizar carrito en la página de carrito
function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    
    if (!cartContainer) return;
    
    const cart = initCart();
    
    // Limpiar el contenedor
    cartContainer.innerHTML = '';
    
    if (cart.items.length === 0) {
        // Mostrar mensaje si el carrito está vacío
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <p>Tu carrito está vacío</p>
                <a href="index.html" class="btn">Ir a la tienda</a>
            </div>
        `;
        
        if (cartTotalElement) {
            cartTotalElement.textContent = '$0';
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
        
        // Añadir filas para cada producto
        cart.items.forEach(item => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td class="product-info">
                    <img src="${item.imagen}" alt="${item.nombre}" onerror="this.src='assets/images/productos/default.jpg'">
                    <div>
                        <h4>${item.nombre}</h4>
                    </div>
                </td>
                <td class="price">$${formatPrice(item.precio)}</td>
                <td class="quantity">
                    <div class="quantity-control">
                        <button class="quantity-btn dec" data-id="${item.id}">-</button>
                        <input type="number" value="${item.cantidad}" min="1" class="quantity-input" data-id="${item.id}">
                        <button class="quantity-btn inc" data-id="${item.id}">+</button>
                    </div>
                </td>
                <td class="subtotal">$${formatPrice(item.precio * item.cantidad)}</td>
                <td class="actions">
                    <button class="remove-btn" data-id="${item.id}">🗑️</button>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
        
        // Actualizar total
        if (cartTotalElement) {
            cartTotalElement.textContent = `$${formatPrice(cart.total)}`;
        }
        
        // Añadir botones de acción al final del carrito
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'cart-actions';
        actionsDiv.innerHTML = `
            <button id="clear-cart" class="btn btn-secondary">Vaciar carrito</button>
            <button id="checkout-btn" class="btn">Proceder al pago</button>
        `;
        
        cartContainer.appendChild(actionsDiv);
        
        // Añadir eventos a los botones
        addCartEventListeners();
    }
}

// Añadir eventos a los elementos del carrito
function addCartEventListeners() {
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
            // Aquí iría la lógica para proceder al pago
            alert('Funcionalidad de pago en desarrollo');
        });
    }
}

// Formatear precios (misma función que en productos.js)
function formatPrice(price) {
    return new Intl.NumberFormat('es-CL').format(price);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Actualizar contador del carrito
    updateCartCount();
    
    // Renderizar carrito si estamos en la página de carrito
    if (window.location.pathname.includes('carrito.html')) {
        renderCart();
    }
});