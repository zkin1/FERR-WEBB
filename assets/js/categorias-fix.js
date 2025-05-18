// categorias-direct-fix.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛠️ Aplicando corrección directa para categorías...');
    
    // La URL correcta para categorías debe ser 3000/api/categorias
    const CATEGORIA_API_URL = `${window.location.protocol}//${window.location.hostname}:3000/api/categorias`;
    console.log('⭐ URL de API de categorías fijada en:', CATEGORIA_API_URL);
    
    // Función original para obtener categorías
    window.getCategorias = async function() {
        try {
            console.log('📢 Solicitando categorías desde:', CATEGORIA_API_URL);
            const response = await fetch(CATEGORIA_API_URL);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📊 Datos recibidos de categorías:', data);
            
            // Asegurarse de que sea un array
            if (!Array.isArray(data)) {
                console.error('❌ La respuesta no es un array, podría estar accediendo a la URL incorrecta:', data);
                // Devolver array vacío o datos de muestra
                return [
                    { id: 1, nombre: 'Herramientas', slug: 'herramientas' },
                    { id: 2, nombre: 'Materiales', slug: 'materiales' },
                    { id: 3, nombre: 'Pintura', slug: 'pintura' },
                    { id: 4, nombre: 'Electricidad', slug: 'electricidad' }
                ];
            }
            
            return data;
        } catch (error) {
            console.error('❌ Error al obtener categorías:', error);
            // Devolver datos de muestra en caso de error
            return [
                { id: 1, nombre: 'Herramientas', slug: 'herramientas' },
                { id: 2, nombre: 'Materiales', slug: 'materiales' },
                { id: 3, nombre: 'Pintura', slug: 'pintura' },
                { id: 4, nombre: 'Electricidad', slug: 'electricidad' }
            ];
        }
    };
    
    // Función directa para cargar categorías en el contenedor
    window.loadCategoriesDirectly = async function() {
        try {
            const categoriesContainer = document.getElementById('categories-container');
            if (!categoriesContainer) return;
            
            // Limpiar el contenedor
            categoriesContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p>Cargando categorías...</p></div>';
            
            // Obtener categorías directamente
            console.log('Cargando categorías directamente...');
            const response = await fetch(CATEGORIA_API_URL);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const categorias = await response.json();
            console.log('Categorías obtenidas directamente:', categorias);
            
            // Verificar si es un array
            if (!Array.isArray(categorias)) {
                console.error('La respuesta no es un array de categorías:', categorias);
                categoriesContainer.innerHTML = '<div class="alert alert-warning">Error en el formato de datos de categorías</div>';
                return;
            }
            
            // Si no hay categorías mostrar mensaje
            if (categorias.length === 0) {
                categoriesContainer.innerHTML = '<div class="alert alert-info">No hay categorías disponibles</div>';
                return;
            }
            
            // Limpiar container
            categoriesContainer.innerHTML = '';
            
            // Crear tarjetas para cada categoría
            categorias.forEach(categoria => {
                const card = document.createElement('div');
                card.className = 'col';
                card.innerHTML = `
                    <div class="card h-100 shadow-sm">
                        <div class="text-center p-3">
                            <img src="/assets/images/categorias/${categoria.slug || categoria.id}.jpg" 
                                class="card-img-top" 
                                alt="${categoria.nombre}" 
                                style="height: 150px; object-fit: contain;"
                                onerror="this.src='/assets/images/categorias/default.jpg'">
                        </div>
                        <div class="card-body text-center">
                            <h5 class="card-title">${categoria.nombre}</h5>
                            <a href="/pages/categorias.html?id=${categoria.id}" class="btn btn-outline-primary">
                                Ver productos
                            </a>
                        </div>
                    </div>
                `;
                categoriesContainer.appendChild(card);
            });
            
        } catch (error) {
            console.error('Error al cargar categorías directamente:', error);
            const categoriesContainer = document.getElementById('categories-container');
            if (categoriesContainer) {
                categoriesContainer.innerHTML = '<div class="alert alert-danger">Error al cargar las categorías. Intente nuevamente más tarde.</div>';
            }
        }
    };
    
    // Intentar cargar categorías ahora
    const categoriesContainer = document.getElementById('categories-container');
    if (categoriesContainer) {
        console.log('Contenedor de categorías encontrado, cargando...');
        window.loadCategoriesDirectly();
    }
    
    console.log('✅ Corrección de categorías aplicada');
});