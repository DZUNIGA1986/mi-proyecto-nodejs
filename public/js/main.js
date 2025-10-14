        // Variables globales
        let authToken = localStorage.getItem('authToken');
        const API_BASE = 'https://continuing-sybilla-1proyectosmv-dz1-24c23044.koyeb.app/api';

        // Verificar estado del servidor
        async function checkServerStatus() {
            try {
                const response = await fetch('https://continuing-sybilla-1proyectosmv-dz1-24c23044.koyeb.app/health');
                const data = await response.json();
                
                document.getElementById('statusIndicator').className = 'status-indicator online';
                document.getElementById('serverStatus').innerHTML = `
                    ✅ <strong>Servidor Online</strong><br>
                    Versión: ${data.version}<br>
                    Entorno: ${data.environment}<br>
                    Timestamp: ${new Date(data.timestamp).toLocaleString()}
                `;
            } catch (error) {
                document.getElementById('statusIndicator').className = 'status-indicator offline';
                document.getElementById('serverStatus').innerHTML = '❌ <strong>Servidor Offline</strong><br>Asegúrate de que el servidor esté ejecutándose en el puerto 8000';
            }
        }

        // Función helper para hacer peticiones
        async function apiRequest(url, options = {}) {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            if (authToken) {
                defaultOptions.headers.Authorization = `Bearer ${authToken}`;
            }
            console.log(authToken);
            const response = await fetch(url, { ...defaultOptions, ...options });
            return await response.json();
        }

        // Mostrar respuesta en la interfaz
        function showResponse(elementId, data, isSuccess = true) {
            const element = document.getElementById(elementId);
            element.style.display = 'block';
            element.className = `response ${isSuccess ? 'success' : 'error'}`;
            element.textContent = JSON.stringify(data, null, 2);
        }

        // Actualizar estado de autenticación
        function updateAuthState() {
            const isLoggedIn = !!authToken;
            const createProductBtn = document.getElementById('createProductBtn');
            
            if (isLoggedIn) {
                createProductBtn.disabled = false;
                createProductBtn.textContent = 'Crear Producto';
            } else {
                createProductBtn.disabled = true;
                createProductBtn.textContent = 'Crear Producto (Login requerido)';
            }
        }

        // Event Listeners
        document.addEventListener('DOMContentLoaded', function() {
            checkServerStatus();
            updateAuthState();
            loadCategories();// Cargar categorías desde la BD
                    
           
            // Registro de usuario
            document.getElementById('registerForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const userData = {
                    name: document.getElementById('regName').value,
                    email: document.getElementById('regEmail').value,
                    password: document.getElementById('regPassword').value
                };

                try {
                    const data = await apiRequest(`${API_BASE}/users/register`, {
                        method: 'POST',
                        body: JSON.stringify(userData)
                    });

                    if (data.success) {
                        authToken = data.data.token;
                        localStorage.setItem('authToken', authToken);
                        updateAuthState();
                        showResponse('registerResponse', data, true);
                        document.getElementById('registerForm').reset();
                    } else {
                        showResponse('registerResponse', data, false);
                    }
                } catch (error) {
                    showResponse('registerResponse', { error: error.message }, false);
                }
            });

            // Login
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const loginData = {
                    email: document.getElementById('loginEmail').value,
                    password: document.getElementById('loginPassword').value
                };

                try {
                    const data = await apiRequest(`${API_BASE}/users/login`, {
                        method: 'POST',
                        body: JSON.stringify(loginData)
                    });

                    if (data.success) {
                        authToken = data.data.token;
                        localStorage.setItem('authToken', authToken);
                        updateAuthState();
                        showResponse('loginResponse', {
                            success: true,
                            message: 'Login exitoso',
                            user: data.data.user
                        }, true);
                        document.getElementById('loginForm').reset();
                    } else {
                        showResponse('loginResponse', data, false);
                    }
                } catch (error) {
                    showResponse('loginResponse', { error: error.message }, false);
                }
            });


         

            async function loadCategories() {
                try {
                    const response = await fetch('https://continuing-sybilla-1proyectosmv-dz1-24c23044.koyeb.app/api/categories');
                    const result = await response.json();

                    const selectElement = document.getElementById('productCategory');
                    
                    // Limpiar opciones existentes (excepto la primera)
                    selectElement.innerHTML = '<option value="">Selecciona categoría</option>';

                    if (result.success && result.data && result.data.length > 0) {
                        // Agregar cada categoría como opción
                        result.data.forEach(category => {
                            const option = document.createElement('option');
                            option.value = category.description;
                            option.textContent = category.description;
                            selectElement.appendChild(option);
                        });
                    } else {
                        // Si no hay categorías, mostrar mensaje
                        const option = document.createElement('option');
                        option.value = '';
                        option.textContent = 'No hay categorías disponibles';
                        option.disabled = true;
                        selectElement.appendChild(option);
                    }
                } catch (error) {
                    console.error('Error al cargar categorías:', error);
                    
                    // Mostrar opción de error
                    const selectElement = document.getElementById('productCategory');
                    selectElement.innerHTML = '<option value="">Error al cargar categorías</option>';
                }
            }



            // Crear producto
            document.getElementById('productForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                if (!authToken) {
                    showResponse('productResponse', { error: 'Debes iniciar sesión primero' }, false);
                    return;
                }

                const productData = {
                    name: document.getElementById('productName').value,
                    description: document.getElementById('productDescription').value,
                    price: parseFloat(document.getElementById('productPrice').value),
                    category: document.getElementById('productCategory').value,
                    stock: parseInt(document.getElementById('productStock').value)
                };
                    console.log(document.getElementById('productCategory').value);
                try {
                    const data = await apiRequest(`${API_BASE}/products`, {
                        method: 'POST',
                        body: JSON.stringify(productData)
                    });
                        console.log({ productData });
                    if (data.success) {
                        showResponse('productResponse', data, true);
                        document.getElementById('productForm').reset();
                        // Recargar productos automáticamente
                       loadProducts();
                    } else {
                        showResponse('productResponse', data, false);
                    }
                } catch (error) {
                    showResponse('productResponse', { error: error.message }, false);
                }
            });

            // Cargar productos
            document.getElementById('loadProductsBtn').addEventListener('click', loadProducts);
        });

        // Función para cargar productos
        async function loadProducts() {
            try {
                const data = await apiRequest(`${API_BASE}/products`);
                
                if (data.success) {
                    const formattedData = {
                        success: true,
                        totalProducts: data.data.pagination.totalRecords,
                        products: data.data.products.map(product => ({
                            id: product.id,
                            name: product.name,
                            price: `${product.price}`,
                            category: product.category,
                            stock: product.stock,
                            createdAt: new Date(product.created_at).toLocaleDateString()
                        }))
                    };
                    showResponse('productsResponse', formattedData, true);
                } else {
                    showResponse('productsResponse', data, false);
                }
            } catch (error) {
                showResponse('productsResponse', { error: error.message }, false);
            }
        }

        // Verificar estado del servidor cada 30 segundos
        setInterval(checkServerStatus, 30000);
