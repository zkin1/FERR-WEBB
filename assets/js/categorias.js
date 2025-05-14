// Función unificada para crear enlaces a categorías
function createCategoryUrl(categoriaId) {
    // Si ya estamos en la página de categorías, solo cambiar el parámetro
    if (window.location.pathname.includes('categorias.html')) {
        return `?id=${categoriaId}`;
    } else {
        // URL absoluta hacia la página de categorías
        return `/pages/categorias.html?id=${categoriaId}`;
    }
}

// Función para mostrar categorías
async function mostrarCategoriasBootstrap() {
    const container = document.getElementById('categories-container');
    if (!container) return;
    
    try {
        // Intentar obtener categorías de la API
        const response = await fetch('http://localhost:3000/api/categorias');
        
        if (!response.ok) {
            throw new Error('No se pudieron cargar las categorías');
        }
        
        const categorias = await response.json();
        
        // Limpiar el contenedor
        container.innerHTML = '';
        
        // Colores de fondo para categorías
        const bgColors = [
            'rgba(0, 102, 204, 0.8)',  // Azul
            'rgba(0, 153, 51, 0.8)',   // Verde
            'rgba(204, 51, 0, 0.8)',   // Rojo
            'rgba(102, 0, 204, 0.8)',  // Púrpura
            'rgba(204, 153, 0, 0.8)'   // Ámbar
        ];
        
        // Mostrar categorías con diseño mejorado
        categorias.forEach((categoria, index) => {
            const col = document.createElement('div');
            col.className = 'col';
            
            // Usar un color de fondo diferente para cada categoría
            const bgColor = bgColors[index % bgColors.length];
            
            col.innerHTML = `
                <a href="${createCategoryUrl(categoria.id)}" class="text-decoration-none">
                    <div class="category-card shadow" style="background-color: ${bgColor};">
                        <div class="category-overlay">
                            <h3 class="category-name">${categoria.nombre}</h3>
                        </div>
                    </div>
                </a>
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
    
    // Categorías de ejemplo
    const categorias = [
        { id: 1, nombre: 'Herramientas', color: 'rgba(0, 102, 204, 0.8)' },
        { id: 2, nombre: 'Materiales', color: 'rgba(0, 153, 51, 0.8)' },
        { id: 3, nombre: 'Electricidad', color: 'rgba(204, 51, 0, 0.8)' },
        { id: 4, nombre: 'Plomería', color: 'rgba(102, 0, 204, 0.8)' },
        { id: 5, nombre: 'Ferretería General', color: 'rgba(204, 153, 0, 0.8)' }
    ];
    
    // Limpiar el contenedor
    container.innerHTML = '';
    
    // Mostrar categorías de muestra
    categorias.forEach(categoria => {
        const col = document.createElement('div');
        col.className = 'col';
        
        col.innerHTML = `
            <a href="${createCategoryUrl(categoria.id)}" class="text-decoration-none">
                <div class="category-card shadow" style="background-color: ${categoria.color};">
                    <div class="category-overlay">
                        <h3 class="category-name">${categoria.nombre}</h3>
                    </div>
                </div>
            </a>
        `;
        
        container.appendChild(col);
    });
}

// Función para mostrar productos de una categoría
async function mostrarProductosCategoriaBootstrap(categoriaId) {
    const container = document.getElementById('category-products');
    const titleElement = document.getElementById('category-title');
    const categoryNameElement = document.getElementById('category-name');
    
    if (!container) return;
    
    try {
        // Intentar obtener productos de la categoría desde la API
        const response = await fetch(`http://localhost:3000/api/categorias/${categoriaId}/productos`);
        
        if (!response.ok) {
            throw new Error('No se pudieron cargar los productos');
        }
        
        const result = await response.json();
        const productos = result.productos || result;
        
        // También obtener información de la categoría
        const catResponse = await fetch(`http://localhost:3000/api/categorias/${categoriaId}`);
        let categoria = { nombre: `Categoría #${categoriaId}` };
        
        if (catResponse.ok) {
            categoria = await catResponse.json();
        }
        
        // Cambiar título
        if (titleElement) titleElement.textContent = `Productos de ${categoria.nombre}`;
        if (categoryNameElement) categoryNameElement.textContent = categoria.nombre;
        
        // Ocultar la sección de categorías cuando mostramos productos
        const categoriesSection = document.querySelector('section:not(.bg-light)');
        if (categoriesSection) {
            categoriesSection.style.display = 'none';
        }
        
        // Limpiar el contenedor
        container.innerHTML = '';
        
        if (!productos || productos.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-info" role="alert">
                        <i class="fas fa-info-circle me-2"></i>
                        No hay productos disponibles en esta categoría
                    </div>
                </div>
            `;
            return;
        }
        
        // Mostrar productos con Bootstrap
        productos.forEach(producto => {
            const col = document.createElement('div');
            col.className = 'col';
            
            const defaultImage = '/assets/images/default.jpg';
            
            col.innerHTML = `
                <div class="card h-100 shadow-sm">
                    <div class="card-img-top overflow-hidden" style="height: 200px;">
                        <a href="/product-detail.html?id=${producto.id}">
                            <img src="${defaultImage}" class="img-fluid w-100 h-100" alt="${producto.nombre}" style="object-fit: contain;">
                        </a>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">
                            <a href="/product-detail.html?id=${producto.id}" class="text-decoration-none">${producto.nombre}</a>
                        </h5>
                        <div class="card-text mt-auto mb-3">
                            ${producto.precio_oferta ? 
                                `<span class="text-decoration-line-through text-muted me-2">$${formatPrice(producto.precio)}</span>
                                <span class="fw-bold text-danger">$${formatPrice(producto.precio_oferta)}</span>` : 
                                `<span class="fw-bold">$${formatPrice(producto.precio)}</span>`
                            }
                        </div>
                        <button class="btn btn-primary w-100 add-to-cart" data-id="${producto.id}" data-nombre="${producto.nombre}" data-precio="${producto.precio_oferta || producto.precio}" data-imagen="${defaultImage}">
                            <i class="fas fa-cart-plus me-2"></i>Agregar al carrito
                        </button>
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
                    
                    if (typeof addToCart === 'function') {
                        addToCart(productData);
                        showToast('Producto agregado al carrito');
                    } else {
                        showToast('Producto agregado al carrito (simulación)');
                    }
                });
            }
        });
        
    } catch (error) {
        console.error('Error al cargar productos:', error);
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    Error al cargar productos. Por favor, intente nuevamente.
                </div>
            </div>
        `;
    }
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
    // Obtener ID de categoría de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoriaId = urlParams.get('id');
    
    // Flag para controlar si ya se cargó contenido
    let contentLoaded = false;
    
    if (categoriaId) {
        // Cargar productos de la categoría
        mostrarProductosCategoriaBootstrap(categoriaId);
        contentLoaded = true;
    }
    
    // Solo mostrar todas las categorías si no hemos cargado productos específicos
    if (!contentLoaded) {
        mostrarCategoriasBootstrap();
    }
});