// Función para cargar categorías en la página principal
async function loadCategories() {
    try {
        const categoriesContainer = document.getElementById('categories-container');
        if (!categoriesContainer) return;
        
        // Limpiar el contenedor
        categoriesContainer.innerHTML = '<div class="loading">Cargando categorías...</div>';
        
        // Obtener categorías
        const categorias = await getCategorias();
        
        // Verificar si hay categorías
        if (!categorias || categorias.length === 0) {
            categoriesContainer.innerHTML = '<p class="no-categories">No hay categorías disponibles</p>';
            return;
        }
        
        // Limpiar el contenedor
        categoriesContainer.innerHTML = '';
        
        // Crear tarjetas de categorías
        categorias.forEach(categoria => {
            const card = document.createElement('div');
            card.className = 'category-card';
            
            // URL de la imagen (asociación con slug)
            const imageUrl = `assets/images/categorias/${categoria.slug}.jpg`;
            const defaultImage = 'assets/images/categorias/default.jpg';
            
            card.innerHTML = `
                <a href="categorias.html?id=${categoria.id}">
                    <img src="${imageUrl}" alt="${categoria.nombre}" onerror="this.src='${defaultImage}'">
                    <div class="category-overlay">
                        <h3 class="category-name">${categoria.nombre}</h3>
                    </div>
                </a>
            `;
            
            categoriesContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        const categoriesContainer = document.getElementById('categories-container');
        if (categoriesContainer) {
            categoriesContainer.innerHTML = '<p class="error">Error al cargar categorías.</p>';
        }
    }
}

// Función para cargar los productos de una categoría específica
async function loadCategoryProducts(categoriaId) {
    try {
        const productsContainer = document.getElementById('category-products');
        const categoryTitleElem = document.getElementById('category-title');
        
        if (!productsContainer) return;
        
        // Limpiar el contenedor
        productsContainer.innerHTML = '<div class="loading">Cargando productos...</div>';
        
        // Obtener datos de la categoría
        const categoria = await getCategoriaById(categoriaId);
        
        if (!categoria) {
            productsContainer.innerHTML = '<p class="error">Categoría no encontrada</p>';
            return;
        }
        
        // Actualizar título de la categoría
        if (categoryTitleElem) {
            categoryTitleElem.textContent = categoria.nombre;
        }
        
        // Obtener productos de la categoría
        const resultado = await getProductosByCategoria(categoriaId);
        const productos = resultado.productos;
        
        // Verificar si hay productos
        if (!productos || productos.length === 0) {
            productsContainer.innerHTML = '<p class="no-products">No hay productos disponibles en esta categoría</p>';
            return;
        }
        
        // Limpiar el contenedor
        productsContainer.innerHTML = '';
        
        // Crear tarjetas de productos
        productos.forEach(producto => {
            const card = createProductCard(producto);
            productsContainer.appendChild(card);
        });
        
        // Agregar paginación si hay más de una página
        if (resultado.pagination && resultado.pagination.totalPages > 1) {
            addPagination(productsContainer, resultado.pagination, categoriaId);
        }
    } catch (error) {
        console.error('Error al cargar productos de la categoría:', error);
        const productsContainer = document.getElementById('category-products');
        if (productsContainer) {
            productsContainer.innerHTML = '<p class="error">Error al cargar productos.</p>';
        }
    }
}

// Función para añadir paginación
function addPagination(container, pagination, categoriaId) {
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination';
    
    let paginationHTML = '';
    
    // Botón anterior
    if (pagination.page > 1) {
        paginationHTML += `<a href="categorias.html?id=${categoriaId}&page=${pagination.page - 1}" class="page-link">Anterior</a>`;
    } else {
        paginationHTML += `<span class="page-link disabled">Anterior</span>`;
    }
    
    // Páginas
    for (let i = 1; i <= pagination.totalPages; i++) {
        if (i === pagination.page) {
            paginationHTML += `<span class="page-link active">${i}</span>`;
        } else {
            paginationHTML += `<a href="categorias.html?id=${categoriaId}&page=${i}" class="page-link">${i}</a>`;
        }
    }
    
    // Botón siguiente
    if (pagination.page < pagination.totalPages) {
        paginationHTML += `<a href="categorias.html?id=${categoriaId}&page=${pagination.page + 1}" class="page-link">Siguiente</a>`;
    } else {
        paginationHTML += `<span class="page-link disabled">Siguiente</span>`;
    }
    
    paginationDiv.innerHTML = paginationHTML;
    container.appendChild(paginationDiv);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Cargar categorías en la página principal
    if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
        loadCategories();
    }
    
    // Cargar productos de la categoría en la página de categoría
    if (window.location.pathname.includes('categorias.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const categoriaId = urlParams.get('id');
        const page = urlParams.get('page') || 1;
        
        if (categoriaId) {
            loadCategoryProducts(categoriaId, page);
        } else {
            // Si no hay categoría especificada, mostrar todas las categorías
            loadCategories();
        }
    }
});