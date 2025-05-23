document.addEventListener('DOMContentLoaded', function() {
    // Usar la función de config.js para obtener la URL base
    if (window.APP_CONFIG) {
        // NO sobrescribir con localhost fijo
        console.log('API URL en APP_CONFIG:', window.APP_CONFIG.API_URL);
    }
    
    // Usar la URL dinámicamente configurada
    API_URL = window.APP_CONFIG ? window.APP_CONFIG.API_URL : '/api';
    console.log('API URL final:', API_URL);
});

let isFetching = false;

function getBaseUrl() {
    // Obtener la URL completa actual
    const currentUrl = window.location.href;
    console.log('URL actual:', currentUrl);
    
    // Verificar si estamos en index.html en la raíz o en una subcarpeta
    if (currentUrl.includes('/index.html')) {
        if (currentUrl.includes('/ferremas-ecommerce/') || 
            currentUrl.includes('/pages/')) {
            // Estamos en una subcarpeta
            return './';
        } else {
            // Estamos en la raíz
            return 'ferremas-ecommerce/pages/';
        }
    } else if (currentUrl.includes('/ferremas-ecommerce/pages/')) {
        // Estamos en alguna página dentro de /ferremas-ecommerce/pages/
        return './';
    } else {
        // Por defecto, asumir que estamos en la raíz
        return 'ferremas-ecommerce/pages/';
    }
}

// Luego usar esta función para construir URLs
function getProductUrl(productId) {
    return `/ferremas-ecommerce/pages/product-detail.html?id=${productId}`;
}

function getCategoryUrl(categoryId) {
    return `/ferremas-ecommerce/pages/categorias.html?id=${categoryId}`;
}


// Función para obtener datos de la API
async function fetchAPI(endpoint, options = {}) {
    try {
        // Quitar la barra inicial si existe para evitar doble barra
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        
        // Usar directamente la URL de la API de productos en el puerto 3000
        const url = `${API_URL}/${cleanEndpoint}`;
        
        console.log('Fetching:', url);
        
        // Realizar la petición
        const response = await fetch(url, options);
        
        if (!response.ok) {
            console.error(`Error HTTP: ${response.status} - ${response.statusText}`);
            throw new Error(`Error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error en la API:', error);
        
        // Devolver estructuras de datos de fallback según el tipo de endpoint
        if (endpoint.includes('categorias')) {
            return [];
        } else if (endpoint.includes('productos')) {
            return { productos: [], pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 } };
        } else {
            return {};
        }
    }
}


// Obtener todas las categorías
async function getCategorias() {
    try {
        const categorias = await fetchAPI('categorias');
        // Verificar la respuesta para asegurar que sea un array
        if (!Array.isArray(categorias)) {
            console.warn('La respuesta de categorías no es un array:', categorias);
            return []; // Devolver array vacío si no es un array
        }
        return categorias;
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        // Devolver datos de muestra para evitar errores
        return [
            { id: 1, nombre: 'Herramientas', slug: 'herramientas' },
            { id: 2, nombre: 'Herramientas Manuales', slug: 'herramientas-manuales' },
            { id: 3, nombre: 'Herramientas Eléctricas', slug: 'herramientas-electricas' },
            { id: 4, nombre: 'Materiales de Construcción', slug: 'materiales-construccion' },
            { id: 5, nombre: 'Ferretería General', slug: 'ferreteria-general' }
        ];
    }
}

// Obtener una categoría por ID
async function getCategoriaById(id) {
    return await fetchAPI(`/categorias/${id}`);
}

// Obtener subcategorías por ID de categoría
async function getSubcategoriasByCategoria(categoriaId) {
    return await fetchAPI(`/categorias/${categoriaId}/subcategorias`);
}

// Obtener todos los productos (paginados)
async function getProductos(page = 1, limit = 10) {
    try {
        return await fetchAPI(`/productos?page=${page}&limit=${limit}`);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        // Devolver datos de muestra
        return {
            productos: [
                { id: 1, nombre: 'Martillo Profesional', codigo: 'MART001', precio: 12990, categoria_id: 1 },
                { id: 2, nombre: 'Destornillador Eléctrico', codigo: 'DEST001', precio: 19990, categoria_id: 3 },
                { id: 3, nombre: 'Sierra Circular', codigo: 'SIER001', precio: 89990, categoria_id: 3 },
                { id: 4, nombre: 'Cemento 25kg', codigo: 'CEM001', precio: 5990, categoria_id: 4 }
            ],
            pagination: { page: 1, limit: 10, totalItems: 4, totalPages: 1 }
        };
    }
}

const BASE_URL = window.location.origin;
console.log('URL Base del sitio:', BASE_URL);
console.log('Ruta actual:', window.location.pathname);

// Obtener producto por ID
async function getProductoById(id) {
    return await fetchAPI(`/productos/${id}`);
}

// Obtener productos por categoría
async function getProductosByCategoria(categoriaId, page = 1, limit = 10) {
    return await fetchAPI(`/categorias/${categoriaId}/productos?page=${page}&limit=${limit}`);
}

// Obtener productos por subcategoría
async function getProductosBySubcategoria(subcategoriaId, page = 1, limit = 10) {
    return await fetchAPI(`/subcategorias/${subcategoriaId}/productos?page=${page}&limit=${limit}`);
}

// Obtener productos destacados
async function getProductosDestacados(limit = 8) {
    return await fetchAPI(`/productos/destacados?limit=${limit}`);
}

// Obtener productos nuevos
async function getProductosNuevos(limit = 8) {
    return await fetchAPI(`/productos/nuevos?limit=${limit}`);
}

// Buscar productos
async function buscarProductos(query, page = 1, limit = 10) {
    return await fetchAPI(`/productos/buscar?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
}

// Obtener imágenes de un producto
async function getImagenesProducto(productoId) {
    return await fetchAPI(`/productos/${productoId}/imagenes`);
}

// Obtener especificaciones de un producto
async function getEspecificacionesProducto(productoId) {
    return await fetchAPI(`/productos/${productoId}/especificaciones`);
}

// Obtener marcas
async function getMarcas() {
    return await fetchAPI('/marcas');
}

// Obtener marca por ID
async function getMarcaById(id) {
    return await fetchAPI(`/marcas/${id}`);
}



window.appAPI = {
    fetchAPI,
    getCategorias,
    getCategoriaById,
    getSubcategoriasByCategoria,
    getProductos,
    getProductoById,
    getProductosByCategoria,
    getProductosBySubcategoria,
    getProductosDestacados,
    getProductosNuevos,
    buscarProductos,
    getImagenesProducto,
    getEspecificacionesProducto,
    getMarcas,
    getMarcaById
};