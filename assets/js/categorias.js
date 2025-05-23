function createCategoryUrl(categoriaId) {
    // Si ya estamos en la página de categorías, solo cambiar el parámetro
    if (window.location.pathname.includes('categorias.html')) {
        return `?id=${categoriaId}`;
    } else {
        // URL absoluta hacia la página de categorías
        return `/pages/categorias.html?id=${categoriaId}`;
    }
}

// Función para mostrar categorías con Bootstrap mejorado
async function mostrarCategoriasBootstrap() {
    const container = document.getElementById('categories-container');
    if (!container) return;
    
    try {
        console.log('Intentando obtener categorías de la API...');
        // Intentar obtener categorías de la API
        const response = await fetch('http://localhost:3000/api/categorias');
        
        if (!response.ok) {
            throw new Error('No se pudieron cargar las categorías');
        }
        
        const categorias = await response.json();
        console.log('Categorías obtenidas:', categorias);
        
        // Limpiar el contenedor
        container.innerHTML = '';
        
        // Colores de fondo para categorías
        const gradients = [
            'linear-gradient(45deg, #007bff, #00c3ff)',
            'linear-gradient(45deg, #28a745, #7fd858)',
            'linear-gradient(45deg, #fd7e14, #ffb84d)',
            'linear-gradient(45deg, #6f42c1, #a885e0)',
            'linear-gradient(45deg, #ffc107, #ffe066)'
        ];
        
        // Iconos para categorías
        const icons = [
            'fas fa-tools',
            'fas fa-hammer',
            'fas fa-bolt',
            'fas fa-building',
            'fas fa-cogs'
        ];
        
        // Mostrar categorías con diseño mejorado
        categorias.forEach((categoria, index) => {
            const col = document.createElement('div');
            col.className = 'col';
            
            // Usar un gradient y un icono
            const gradient = gradients[index % gradients.length];
            const icon = icons[index % icons.length];
            
            // Crear la URL de la categoría - IMPORTANTE
            const categoriaUrl = createCategoryUrl(categoria.id);
            
            col.innerHTML = `
                <div class="card category-card h-100 border-0 shadow-sm overflow-hidden">
                    <div class="position-relative">
                        <div class="category-gradient" style="background: ${gradient};"></div>
                        <div class="category-content p-4 text-white">
                            <div class="category-icon mb-3">
                                <i class="${icon} fa-3x"></i>
                            </div>
                            <h3 class="h4 mb-2">${categoria.nombre}</h3>
                            <p class="mb-0 opacity-75">Encuentra los mejores productos</p>
                            <div class="mt-3">
                                <a href="${categoriaUrl}" class="btn btn-sm btn-light">Ver Productos <i class="fas fa-chevron-right ms-1"></i></a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(col);
        });
        
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        // Mostrar categorías de muestra
        mostrarCategoriasDeMuestraBootstrap();
    }
}

// Función para mostrar categorías de muestra
function mostrarCategoriasDeMuestraBootstrap() {
    const container = document.getElementById('categories-container');
    if (!container) return;
    
    // Categorías de ejemplo - ACTUALIZADAS PARA COINCIDIR CON LA API
    const categorias = [
        { id: 1, nombre: 'Herramientas', color: 'rgba(0, 102, 204, 0.8)' },
        { id: 4, nombre: 'Herramientas Manuales', color: 'rgba(0, 153, 51, 0.8)' },
        { id: 5, nombre: 'Herramientas Eléctricas', color: 'rgba(204, 51, 0, 0.8)' }
    ];
    
    // Limpiar el contenedor
    container.innerHTML = '';
    
    // Mostrar categorías de muestra
    categorias.forEach(categoria => {
        const col = document.createElement('div');
        col.className = 'col';
        
        // Crear la URL
        const categoriaUrl = createCategoryUrl(categoria.id);
        
        col.innerHTML = `
            <div class="card category-card h-100 border-0 shadow-sm overflow-hidden">
                <div class="position-relative" style="background-color: ${categoria.color};">
                    <div class="category-content p-4 text-white">
                        <h3 class="h4 mb-2">${categoria.nombre}</h3>
                        <p class="mb-0 opacity-75">Encuentra los mejores productos</p>
                        <div class="mt-3">
                            <a href="${categoriaUrl}" class="btn btn-sm btn-light">Ver Productos <i class="fas fa-chevron-right ms-1"></i></a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(col);
    });
}

// Función para agregar al carrito (respaldo si la global no está disponible)
function addToCartFallback(product) {
    console.log('Usando método de respaldo para agregar al carrito');
    
    // Obtener carrito actual de localStorage
    let cart = JSON.parse(localStorage.getItem('carrito')) || { items: [], total: 0 };
    
    // Verificar si el producto ya existe
    const existingItemIndex = cart.items.findIndex(item => item.id === product.id);
    
    if (existingItemIndex >= 0) {
        // Actualizar cantidad si ya existe
        cart.items[existingItemIndex].cantidad += product.cantidad;
        cart.items[existingItemIndex].subtotal = cart.items[existingItemIndex].precio * cart.items[existingItemIndex].cantidad;
    } else {
        // Añadir nuevo producto
        cart.items.push({
            ...product,
            subtotal: product.precio * product.cantidad
        });
    }
    
    // Recalcular total
    cart.total = cart.items.reduce((sum, item) => sum + (item.subtotal || item.precio * item.cantidad), 0);
    
    // Guardar en localStorage
    localStorage.setItem('carrito', JSON.stringify(cart));
    
    // Actualizar contador del carrito
    if (typeof window.updateCartCount === 'function') {
        window.updateCartCount();
    } else {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            // Calcular cantidad total de productos
            const itemCount = cart.items.reduce((sum, item) => sum + (item.cantidad || 0), 0);
            cartCount.textContent = itemCount;
        }
    }
}

// Función para mostrar productos de una categoría
async function mostrarProductosCategoriaBootstrap(categoriaId) {
    console.log("Mostrando productos para categoría ID:", categoriaId);
    
    const container = document.getElementById('category-products');
    if (!container) {
        console.error("No se encontró el contenedor de productos");
        return;
    }
    
    // Mostrar sección de productos y ocultar categorías
    const categoriesSection = document.getElementById('categories-section');
    const productsSection = document.getElementById('products-section');
    
    if (categoriesSection && productsSection) {
        categoriesSection.style.display = 'none';
        productsSection.style.display = 'block';
    } else {
        console.error("No se encontraron las secciones necesarias");
    }
    
    try {
        // Intentamos obtener los productos desde la API
        console.log('Intentando obtener productos de la API para categoría:', categoriaId);
        // URL REAL para obtener productos de una categoría
        const response = await fetch(`http://localhost:3000/api/categorias/${categoriaId}/productos`);
        
        if (!response.ok) {
            throw new Error(`Error obteniendo productos: ${response.status}`);
        }
        
        const resultado = await response.json();
        console.log('Productos obtenidos:', resultado);
        
        // Datos para mapear los nombres de categoría
        const categoriasNombres = {
            '1': 'Herramientas',
            '4': 'Herramientas Manuales',
            '5': 'Herramientas Eléctricas'
        };
        
        // Actualizar título y breadcrumb
        const nombreCategoria = categoriasNombres[categoriaId] || `Categoría ${categoriaId}`;
        
        const categoryTitleElem = document.getElementById('category-title');
        const categoryNameElem = document.getElementById('category-name');
        
        if (categoryTitleElem) categoryTitleElem.textContent = `Productos de ${nombreCategoria}`;
        if (categoryNameElem) categoryNameElem.textContent = nombreCategoria;
        
        // Obtenemos los productos del resultado
        const productos = resultado.productos || resultado;
        
        // Limpiar el contenedor
        container.innerHTML = '';
        
        // Si no hay productos
        if (!productos || productos.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        No hay productos disponibles en esta categoría por el momento.
                    </div>
                    <a href="/pages/categorias.html" class="btn btn-primary mt-3">
                        <i class="fas fa-arrow-left me-2"></i> Ver todas las categorías
                    </a>
                </div>
            `;
            return;
        }
        
        // Mostrar productos
        productos.forEach(producto => {
            const col = document.createElement('div');
            col.className = 'col';
            
            // CORRECCIÓN: URL del detalle correcta
            const productDetailUrl = `/product-detail.html?id=${producto.id}`;
            
            col.innerHTML = `
                <div class="card h-100 shadow-sm product-card">
                    <div class="text-center p-3">
                        <img src="/assets/images/productos/${producto.codigo}.jpg" class="img-fluid" alt="${producto.nombre}" style="height: 150px; object-fit: contain;" onerror="this.onerror=null; this.src='/assets/images/default.jpg';">
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">
                            <a href="${productDetailUrl}" class="text-decoration-none">${producto.nombre}</a>
                        </h5>
                        <p class="card-text text-muted small">Código: ${producto.codigo || 'N/A'}</p>
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <span class="fw-bold text-primary">$${formatPrice(producto.precio)}</span>
                            <button class="btn btn-outline-primary btn-sm add-to-cart" data-id="${producto.id}" data-nombre="${producto.nombre}" data-precio="${producto.precio}" data-imagen="/assets/images/productos/${producto.codigo}.jpg">
                                <i class="fas fa-cart-plus"></i> Agregar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(col);
            
            // Agregar evento al botón
            const addButton = col.querySelector('.add-to-cart');
            if (addButton) {
                addButton.addEventListener('click', function() {
                    const productData = {
                        id: this.dataset.id,
                        nombre: this.dataset.nombre,
                        precio: parseFloat(this.dataset.precio),
                        imagen: this.dataset.imagen,
                        cantidad: 1
                    };
                    
                    console.log('Intentando agregar producto al carrito:', productData.nombre);
                    
                    // Verificar si la función está disponible en el objeto window
                    if (typeof window.addToCart === 'function') {
                        console.log('Función window.addToCart disponible, usándola');
                        window.addToCart(productData);
                    } else if (typeof addToCart === 'function') {
                        console.log('Función addToCart disponible, usándola');
                        addToCart(productData);
                    } else {
                        console.error("Función addToCart no disponible, usando respaldo");
                        // Usar función de respaldo
                        addToCartFallback(productData);
                    }
                });
            }
        });
        
        // Botón para volver
        const volverDiv = document.createElement('div');
        volverDiv.className = 'col-12 text-center mt-4';
        volverDiv.innerHTML = `
            <a href="/pages/categorias.html" class="btn btn-outline-primary">
                <i class="fas fa-arrow-left me-2"></i> Ver todas las categorías
            </a>
        `;
        container.appendChild(volverDiv);
        
    } catch (error) {
        console.error('Error al mostrar productos:', error);
        
        // Si la API falla, intentamos mostrar los productos de ejemplo
        mostrarProductosEjemploPorCategoria(categoriaId, container);
    }
}

// Función para mostrar productos de ejemplo como respaldo
function mostrarProductosEjemploPorCategoria(categoriaId, container) {
    // Datos de ejemplo para productos ACTUALIZADOS PARA COINCIDIR CON LA API
    const productos = [
        { id: 1, nombre: 'Martillo Profesional', codigo: 'HM001', precio: 15.99, categoria_id: 4 },
        { id: 2, nombre: 'Juego de Destornilladores', codigo: 'HM002', precio: 12.50, categoria_id: 1 },
        { id: 3, nombre: 'Alicate Universal', codigo: 'HM003', precio: 8.75, categoria_id: 1 },
        { id: 4, nombre: 'Juego de Llaves Combinadas', codigo: 'HM004', precio: 29.99, categoria_id: 1 },
        { id: 21, nombre: 'Taladro Percutor', codigo: 'HE001', precio: 89.99, categoria_id: 5 },
        { id: 22, nombre: 'Sierra Circular', codigo: 'HE002', precio: 129.50, categoria_id: 5 }
    ];
    
    // Filtrar por categoría
    const productosFiltrados = productos.filter(p => Number(p.categoria_id) === Number(categoriaId));
    console.log("Productos filtrados de ejemplo:", productosFiltrados.length);
    
    // Limpiar el contenedor
    container.innerHTML = '';
    
    if (productosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No hay productos disponibles en esta categoría por el momento.
                </div>
                <a href="/pages/categorias.html" class="btn btn-primary mt-3">
                    <i class="fas fa-arrow-left me-2"></i> Ver todas las categorías
                </a>
            </div>
        `;
        return;
    }
    
    // Mostrar productos
    productosFiltrados.forEach(producto => {
        const col = document.createElement('div');
        col.className = 'col';
        
        const productDetailUrl = `/product-detail.html?id=${producto.id}`;
        
        col.innerHTML = `
            <div class="card h-100 shadow-sm product-card">
                <div class="text-center p-3">
                    <img src="/assets/images/productos/${producto.codigo}.jpg" class="img-fluid" alt="${producto.nombre}" style="height: 150px; object-fit: contain;" onerror="this.onerror=null; this.src='/assets/images/default.jpg';">
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">
                        <a href="${productDetailUrl}" class="text-decoration-none">${producto.nombre}</a>
                    </h5>
                    <p class="card-text text-muted small">Código: ${producto.codigo || 'N/A'}</p>
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <span class="fw-bold text-primary">$${formatPrice(producto.precio)}</span>
                        <button class="btn btn-outline-primary btn-sm add-to-cart" data-id="${producto.id}" data-nombre="${producto.nombre}" data-precio="${producto.precio}" data-imagen="/assets/images/productos/${producto.codigo}.jpg">
                            <i class="fas fa-cart-plus"></i> Agregar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(col);
        
        // Agregar evento al botón
        const addButton = col.querySelector('.add-to-cart');
        if (addButton) {
            addButton.addEventListener('click', function() {
                const productData = {
                    id: this.dataset.id,
                    nombre: this.dataset.nombre,
                    precio: parseFloat(this.dataset.precio),
                    imagen: this.dataset.imagen,
                    cantidad: 1
                };
                
                // Verificar si la función está disponible en el objeto window
                if (typeof window.addToCart === 'function') {
                    window.addToCart(productData);
                } else if (typeof addToCart === 'function') {
                    addToCart(productData);
                } else {
                    console.error("Función addToCart no disponible, usando respaldo");
                    // Usar función de respaldo
                    addToCartFallback(productData);
                }
                
                // Mostrar notificación - usar la función global si está disponible
                if (typeof window.showToast === 'function') {
                    window.showToast('Producto agregado al carrito', 'success');
                } else {
                    showToast('Producto agregado al carrito');
                }
            });
        }
    });
    
    // Botón para volver
    const volverDiv = document.createElement('div');
    volverDiv.className = 'col-12 text-center mt-4';
    volverDiv.innerHTML = `
        <a href="/pages/categorias.html" class="btn btn-outline-primary">
            <i class="fas fa-arrow-left me-2"></i> Ver todas las categorías
        </a>
    `;
    container.appendChild(volverDiv);
}

// Formatear precios
function formatPrice(price) {
    return new Intl.NumberFormat('es-CL').format(price);
}

// Mostrar toast
function showToast(message) {
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
    toast.className = 'toast align-items-center text-white bg-success border-0';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-check-circle me-2"></i>${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Inicializar y mostrar el toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Eliminar el toast después de ocultarse
    toast.addEventListener('hidden.bs.toast', function() {
        this.remove();
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado - Inicializando categorias.html');
    
    // Verificar si las funciones del carrito están disponibles
    console.log('Verificando disponibilidad de funciones:');
    console.log(' - addToCart:', typeof window.addToCart === 'function' ? 'Disponible ✓' : 'No disponible ✗');
    console.log(' - updateCartCount:', typeof window.updateCartCount === 'function' ? 'Disponible ✓' : 'No disponible ✗');
    
    // Inicializar el contador del carrito si existe la función
    if (typeof window.updateCartCount === 'function') {
        window.updateCartCount();
    } else if (typeof updateCartCount === 'function') {
        updateCartCount();
    }
    
    // Obtener ID de categoría de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoriaId = urlParams.get('id');
    console.log('ID de categoría en URL:', categoriaId);
    
    if (categoriaId) {
        // Si hay un ID, mostrar los productos de esa categoría
        mostrarProductosCategoriaBootstrap(categoriaId);
    } else {
        // Mostrar todas las categorías
        const categoriesSection = document.getElementById('categories-section');
        const productsSection = document.getElementById('products-section');
        
        if (categoriesSection) categoriesSection.style.display = 'block';
        if (productsSection) productsSection.style.display = 'none';
        
        // Cargar las categorías
        mostrarCategoriasBootstrap();
    }
});