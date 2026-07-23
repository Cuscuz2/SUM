// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    inicializarEventos();
    llenarSelects();
    detectarUbicacion();
    console.log('🚀 SUM - Sistema de Ubicación Metro cargado correctamente');
});

// ============================================
// 1. MENÚ MÓVIL
// ============================================
function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    const toggle = document.getElementById('menuToggle');
    menu.classList.toggle('active');
    toggle.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
}

// ============================================
// 2. ANIMACIONES FADE-IN AL SCROLL
// ============================================
function inicializarFadeIn() {
    const fadeElements = document.querySelectorAll('.fade-in');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    fadeElements.forEach(el => observer.observe(el));
}

// ============================================
// 3. BUSCADOR DE ESTACIONES
// ============================================
let stations = [];

function inicializarBuscador() {
    const searchInput = document.getElementById('stationSearch');
    const resultsContainer = document.getElementById('stationResults');
    const clearBtn = document.getElementById('clearSearch');
    const stationElements = document.querySelectorAll('#stationList > div');
    
    // Crear array de estaciones
    stations = [];
    stationElements.forEach(el => {
        stations.push({
            nombre: el.getAttribute('data-nombre'),
            linea: el.getAttribute('data-linea'),
            zona: el.getAttribute('data-zona'),
            color: el.getAttribute('data-color')
        });
    });

    // Eventos
    searchInput.addEventListener('input', function() {
        buscarEstaciones(this.value);
    });

    clearBtn.addEventListener('click', function() {
        searchInput.value = '';
        resultsContainer.classList.add('hidden');
        this.classList.remove('visible');
        searchInput.focus();
    });

    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.classList.add('hidden');
        }
    });
}

function buscarEstaciones(query) {
    const searchInput = document.getElementById('stationSearch');
    const resultsContainer = document.getElementById('stationResults');
    const clearBtn = document.getElementById('clearSearch');
    const searchTerm = query.toLowerCase().trim();
    
    if (searchTerm === '') {
        resultsContainer.classList.add('hidden');
        clearBtn.classList.remove('visible');
        return;
    }

    clearBtn.classList.add('visible');

    const resultados = stations.filter(station => 
        station.nombre.toLowerCase().includes(searchTerm) ||
        station.linea.toLowerCase().includes(searchTerm)
    );

    if (resultados.length === 0) {
        resultsContainer.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                <i data-lucide="search-x" class="w-6 h-6 mx-auto mb-2" aria-hidden="true"></i>
                No se encontraron estaciones
            </div>
        `;
        resultsContainer.classList.remove('hidden');
        lucide.createIcons();
        return;
    }

    let html = '';
    resultados.forEach(station => {
        html += `
            <div class="station-item" onclick="seleccionarEstacion('${station.nombre}')">
                <span class="font-medium">${station.nombre}</span>
                <span class="linea-badge" style="background: ${station.color}; color: white; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-left: 8px;">
                    Línea ${station.linea}
                </span>
                <span class="text-xs text-gray-400 ml-2">Zona ${station.zona}</span>
            </div>
        `;
    });

    resultsContainer.innerHTML = html;
    resultsContainer.classList.remove('hidden');
    lucide.createIcons();
}

function seleccionarEstacion(nombre) {
    const searchInput = document.getElementById('stationSearch');
    const resultsContainer = document.getElementById('stationResults');
    const clearBtn = document.getElementById('clearSearch');
    
    searchInput.value = nombre;
    resultsContainer.classList.add('hidden');
    clearBtn.classList.add('visible');
    showToast(`📍 Estación seleccionada: ${nombre}`);
}

function seleccionarEstacionSVG(nombre) {
    const searchInput = document.getElementById('stationSearch');
    const resultsContainer = document.getElementById('stationResults');
    const clearBtn = document.getElementById('clearSearch');
    
    searchInput.value = nombre;
    resultsContainer.classList.add('hidden');
    clearBtn.classList.add('visible');
    showToast(`📍 Estación seleccionada: ${nombre}`);
    document.getElementById('buscador').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ============================================
// 4. CALCULADORA DE RUTA
// ============================================
function llenarSelects() {
    const origenSelect = document.getElementById('origen');
    const destinoSelect = document.getElementById('destino');
    const estacionesUnicas = [...new Set(stations.map(s => s.nombre))].sort();
    
    estacionesUnicas.forEach(nombre => {
        const opt1 = document.createElement('option');
        opt1.value = nombre;
        opt1.textContent = nombre;
        origenSelect.appendChild(opt1);
        
        const opt2 = document.createElement('option');
        opt2.value = nombre;
        opt2.textContent = nombre;
        destinoSelect.appendChild(opt2);
    });
}

function inicializarCalculadora() {
    const calcularBtn = document.getElementById('calcularRuta');
    const origenSelect = document.getElementById('origen');
    const destinoSelect = document.getElementById('destino');
    const resultadoDiv = document.getElementById('resultadoRuta');

    calcularBtn.addEventListener('click', function() {
        const origen = origenSelect.value;
        const destino = destinoSelect.value;

        if (!origen || !destino) {
            showToast('⚠️ Por favor selecciona ambas estaciones');
            return;
        }

        if (origen === destino) {
            showToast('⚠️ El origen y destino deben ser diferentes');
            return;
        }

        // Calcular distancia estimada (simulación educativa)
        const indexOrigen = stations.findIndex(s => s.nombre === origen);
        const indexDestino = stations.findIndex(s => s.nombre === destino);
        const distanciaBase = Math.abs(indexOrigen - indexDestino);
        const distancia = Math.round((distanciaBase * 0.8 + 1) * 10) / 10;
        
        // Calcular tiempo (aproximadamente 2 minutos por estación)
        const tiempoMinutos = Math.round(distanciaBase * 2 + 5);
        const tiempoHoras = Math.floor(tiempoMinutos / 60);
        const tiempoResto = tiempoMinutos % 60;
        const tiempoStr = tiempoHoras > 0 ? `${tiempoHoras}h ${tiempoResto}min` : `${tiempoMinutos} min`;

        // Tarifa fija real del Metro de Medellín
        const tarifaFija = 2800;

        document.getElementById('distancia').textContent = `${distancia} km`;
        document.getElementById('tiempo').textContent = tiempoStr;
        document.getElementById('costo').textContent = `$${tarifaFija.toLocaleString()} COP`;
        
        resultadoDiv.classList.remove('hidden');
        resultadoDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

// ============================================
// 5. MODAL DE LOGIN
// ============================================
function abrirLogin() {
    document.getElementById('loginModal').classList.add('active');
    document.getElementById('loginError').classList.remove('show');
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
    document.getElementById('loginEmail').focus();
}

function cerrarLogin() {
    document.getElementById('loginModal').classList.remove('active');
    document.body.style.overflow = '';
}

function iniciarSesion(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (email && password.length >= 6) {
        showToast(`✅ ¡Bienvenido ${email.split('@')[0]}! Sesión iniciada correctamente`);
        cerrarLogin();
        document.getElementById('loginForm').reset();
    } else {
        document.getElementById('loginError').classList.add('show');
    }
}

// ============================================
// 6. MODAL DE REGISTRO
// ============================================
function abrirRegistro() {
    cerrarLogin();
    document.getElementById('registerModal').classList.add('active');
    document.getElementById('registerError').classList.remove('show');
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
    document.getElementById('regNombre').focus();
}

function cerrarRegistro() {
    document.getElementById('registerModal').classList.remove('active');
    document.body.style.overflow = '';
}

function registrarUsuario(e) {
    e.preventDefault();
    const nombre = document.getElementById('regNombre').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirmPassword').value;

    if (password !== confirm) {
        document.getElementById('registerError').classList.add('show');
        document.getElementById('registerError').textContent = '❌ Las contraseñas no coinciden';
        return;
    }

    if (password.length < 6) {
        document.getElementById('registerError').classList.add('show');
        document.getElementById('registerError').textContent = '❌ La contraseña debe tener al menos 6 caracteres';
        return;
    }

    if (!nombre || !email) {
        document.getElementById('registerError').classList.add('show');
        document.getElementById('registerError').textContent = '❌ Por favor completa todos los campos';
        return;
    }

    showToast(`✅ ¡Bienvenido ${nombre}! Registro exitoso. Ahora puedes iniciar sesión.`);
    cerrarRegistro();
    document.getElementById('registerForm').reset();
    document.getElementById('registerError').classList.remove('show');
    
    setTimeout(() => abrirLogin(), 1000);
}

// ============================================
// 7. TOAST NOTIFICATIONS
// ============================================
function showToast(message) {
    const oldToast = document.querySelector('.toast-notification');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transform = 'translate(-50%, 100%)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3500);
}

// ============================================
// 8. GEOLOCALIZACIÓN
// ============================================
function detectarUbicacion() {
    if (!navigator.geolocation) {
        console.log('Geolocalización no soportada');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            const estacionesCoords = {
                'Niquía': [6.2833, -75.5833],
                'Bello': [6.3333, -75.5667],
                'Madera': [6.3667, -75.5667],
                'Acevedo': [6.3833, -75.5667],
                'Caribe': [6.4167, -75.5667],
                'Universidad': [6.4333, -75.5667],
                'San Antonio': [6.5, -75.5667],
                'Poblado': [6.5667, -75.5833],
                'Itagüí': [6.6333, -75.5833],
                'La Estrella': [6.6667, -75.5833],
                'Estadio': [6.55, -75.6167],
                'San Javier': [6.6, -75.6667],
                'Santo Domingo': [6.3833, -75.5667]
            };

            let estacionCercana = null;
            let distanciaMinima = Infinity;

            for (const [nombre, coords] of Object.entries(estacionesCoords)) {
                const dist = Math.sqrt(
                    Math.pow(lat - coords[0], 2) + 
                    Math.pow(lng - coords[1], 2)
                );
                if (dist < distanciaMinima) {
                    distanciaMinima = dist;
                    estacionCercana = nombre;
                }
            }

            if (estacionCercana) {
                const searchInput = document.getElementById('stationSearch');
                showToast(`📍 Parece que estás cerca de la estación: ${estacionCercana}`);
                searchInput.placeholder = `¿Buscas ${estacionCercana}?`;
            }
        },
        function(error) {
            console.log('Error al obtener ubicación:', error.message);
        },
        { enableHighAccuracy: true }
    );
}

// ============================================
// 9. CERRAR MODALES CON ESC Y CLICK FUERA
// ============================================
function inicializarModales() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            cerrarLogin();
            cerrarRegistro();
            if (document.getElementById('mobileMenu').classList.contains('active')) {
                toggleMenu();
            }
        }
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
}

// ============================================
// 10. INICIALIZAR TODOS LOS EVENTOS
// ============================================
function inicializarEventos() {
    inicializarFadeIn();
    inicializarBuscador();
    inicializarCalculadora();
    inicializarModales();
    
    // Prevenir envío de formularios con Enter
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const submitBtn = this.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.click();
            }
        });
    });

    console.log(`📍 Total de estaciones: ${stations.length}`);
    console.log(`📋 Líneas disponibles: A, B, T-A, J, K, M, H, P, O, 1, 2`);
    console.log('💡 Tip: Usa el buscador para encontrar estaciones rápidamente');
    console.log('🖱️ Haz clic en las estaciones del mapa SVG para buscarlas');
}