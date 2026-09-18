// mapa.js — Proyecto SUM (Sistema de Ubicación Metro)
// Incluye: Mapa Interactivo, Navegación de Vistas, Historial de Viajes,
// y Buscador de estaciones agrupado por línea con dirección exacta.
//
// Cobertura de red: Metro (Línea A y B), Metrocable (K, J, H, L),
// Tranvía de Ayacucho (T-A) y Metroplús (Línea 1 y 2).
// Coordenadas: feed GTFS oficial del Metro de Medellín (ColombiaInfo/ColombiaGTFS).
// Direcciones: Metro de Medellín (metrodemedellin.gov.co) y Wikipedia
// ("Anexo:Estaciones del Metro de Medellín"). Las direcciones marcadas con
// "(aprox.)" no tienen una nomenclatura oficial publicada (paradas de tranvía,
// metrocable o estaciones de Metroplús sin dirección catastral verificada) y
// se calculan a partir de la vía/cruce donde se ubica la estación; se
// recomienda verificarlas en el sitio oficial antes de usarlas como destino
// postal.

const MEDELLIN_CENTRO = [6.2472, -75.5697]; // San Antonio: corazón del sistema

let mapa, capaClara, capaEstandar, capaActual = 'clara';
let marcadorOrigen, marcadorDestino, marcadorUbicacion, lineaRuta;
const capasMetro = {};

// ⚠️ Clave API de CARTO Basemaps
const CARTO_API_KEY = 'cb1_2883_1_32f0bf1288bfd12fd81c1134';

document.addEventListener('DOMContentLoaded', async () => {
    if (window.lucide) lucide.createIcons();

    try {
        await cargarRedMetro();
    } catch (err) {
        console.error('No se pudo cargar la red del sistema:', err);
        mostrarToast('No se pudo cargar el mapa. Intenta recargar la página.');
        return; // sin la red no hay nada que dibujar ni rutas que calcular
    }

    inicializarMapa();
    dibujarRedCompleta();
    construirGrafo();

    configurarZoom();
    configurarUbicacion();
    configurarCapas();
    configurarSwap();
    configurarNavegar();
    configurarLeyenda();
    configurarEnter();
    configurarAutocompletado();
    configurarCambioTarifa();
    configurarUsuario();

    // Navegación entre pestañas (Panel, Historial, Configuración, Soporte)
    configurarNavegacionMenu();

    // Mini-perfil de la barra lateral (foto + nombre)
    cargarPerfil();

    // Ruta inicial
    calcularRuta();
});

/* ---------- Cambiar entre Vistas / Pestañas ---------- */
function configurarNavegacionMenu() {
    const navItems = document.querySelectorAll('.dash-nav-item');
    const views = document.querySelectorAll('.dash-view');

    function cambiarVista(targetId) {
        if (!targetId) return;

        views.forEach(v => v.classList.remove('active'));

        const targetView = document.getElementById(targetId);
        if (targetView) {
            targetView.classList.add('active');

            navItems.forEach(item => {
                if (item.getAttribute('data-target') === targetId) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            if (targetId === 'view-dashboard' && mapa) {
                setTimeout(() => mapa.invalidateSize(), 150);
            }

            if (targetId === 'view-history') {
                cargarHistorial();
            }

            if (targetId === 'view-profile') {
                cargarPerfil();
            }

            if (window.lucide) lucide.createIcons();
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const target = item.getAttribute('data-target');
            if (target) {
                e.preventDefault();
                cambiarVista(target);
            }
        });
    });
}

/* ---------- Mapa Leaflet ---------- */
function inicializarMapa() {
    mapa = L.map('leafletMap', {
        zoomControl: false,
        attributionControl: true
    }).setView(MEDELLIN_CENTRO, 12);

    capaClara = L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=' + CARTO_API_KEY, {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(mapa);

    capaEstandar = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    });

    setTimeout(() => mapa.invalidateSize(), 200);
}

/* =========================================================
   RED COMPLETA DEL SISTEMA
   Antes vivía hardcodeada aquí. Ahora se pide una sola vez al backend
   (PHP/lineas.php) al cargar la página, para poder editar estaciones o
   agregar líneas nuevas sin tocar este archivo. Ver cargarRedMetro().
   ========================================================= */
let LINEAS = {};
let CATEGORIAS_LEYENDA = [];
let ETIQUETAS_LINEA = {};
let ORDEN_LINEAS = [];

// Pide al backend la definición completa de líneas/estaciones. Se llama
// una sola vez, antes de dibujar el mapa o calcular cualquier ruta.
async function cargarRedMetro() {
    const res = await fetch(API_BASE + 'lineas.php', { credentials: 'same-origin' });
    const data = await res.json();
    if (!data.exito) {
        throw new Error(data.mensaje || 'No se pudo cargar la red del sistema.');
    }
    LINEAS = data.red.LINEAS;
    CATEGORIAS_LEYENDA = data.red.CATEGORIAS_LEYENDA;
    ETIQUETAS_LINEA = data.red.ETIQUETAS_LINEA;
    ORDEN_LINEAS = data.red.ORDEN_LINEAS;
}


/* ---------- Etiqueta/color visual de cada línea (para las indicaciones) ---------- */
function infoDeLinea(claveLinea) {
    const linea = LINEAS[claveLinea];
    const cat = CATEGORIAS_LEYENDA.find(c => c.id === linea.categoria);
    return {
        etiqueta: cat ? cat.etiqueta : claveLinea.toUpperCase(),
        color: linea.color
    };
}

/* ---------- Estaciones únicas + detección de transbordos ---------- */
function listaEstacionesUnicas() {
    const vistas = new Map();
    Object.values(LINEAS).forEach(linea => {
        linea.estaciones.forEach(e => {
            if (!vistas.has(e.nombre)) vistas.set(e.nombre, e);
        });
    });
    return [...vistas.values()];
}

function lineasPorEstacion() {
    const mapa = new Map(); // nombre -> Set(claveLinea)
    Object.entries(LINEAS).forEach(([clave, linea]) => {
        linea.estaciones.forEach(e => {
            if (!mapa.has(e.nombre)) mapa.set(e.nombre, new Set());
            mapa.get(e.nombre).add(clave);
        });
    });
    return mapa;
}

/* ---------- Dibujo de la red completa ---------- */
function crearMarcadorEstacion(estacion, color, esTransbordo) {
    const tooltipTexto = estacion.nombre
        + (esTransbordo ? ' (transbordo)' : '')
        + (estacion.dir ? `<br><span style="opacity:.75;font-weight:500;">${estacion.dir}</span>` : '');
    return L.circleMarker([estacion.lat, estacion.lon], {
        radius: esTransbordo ? 7 : 5,
        weight: esTransbordo ? 3 : 2,
        color: '#ffffff',
        fillColor: esTransbordo ? '#0f172a' : color,
        fillOpacity: 1
    }).bindTooltip(tooltipTexto, { direction: 'top', offset: [0, -6] });
}

function dibujarRedCompleta() {
    const transbordos = lineasPorEstacion();

    // Agrupar capas por categoría de leyenda (varias líneas pueden compartir categoría)
    const gruposPorCategoria = {};

    Object.values(LINEAS).forEach(linea => {
        const polilinea = L.polyline(linea.estaciones.map(e => [e.lat, e.lon]), {
            color: linea.color,
            weight: 4,
            opacity: 0.85,
            dashArray: linea.dash || null
        });

        const marcadores = linea.estaciones.map(e => {
            const esTransbordo = transbordos.get(e.nombre).size > 1;
            return crearMarcadorEstacion(e, linea.color, esTransbordo);
        });

        if (!gruposPorCategoria[linea.categoria]) gruposPorCategoria[linea.categoria] = [];
        gruposPorCategoria[linea.categoria].push(polilinea, ...marcadores);
    });

    Object.entries(gruposPorCategoria).forEach(([categoria, capas]) => {
        capasMetro[categoria] = L.layerGroup(capas).addTo(mapa);
    });
}

function configurarLeyenda() {
    const contenedor = document.querySelector('.map-legend');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    CATEGORIAS_LEYENDA.forEach(cat => {
        const pill = document.createElement('button');
        pill.className = 'legend-pill';
        pill.type = 'button';
        pill.dataset.line = cat.id;
        pill.innerHTML = `<span class="legend-dot" style="background:${cat.color};"></span>${cat.etiqueta}`;
        pill.addEventListener('click', () => {
            const capa = capasMetro[cat.id];
            if (!capa) return;
            if (mapa.hasLayer(capa)) {
                mapa.removeLayer(capa);
                pill.classList.add('inactive');
            } else {
                capa.addTo(mapa);
                pill.classList.remove('inactive');
            }
        });
        contenedor.appendChild(pill);
    });
}

/* ---------- Zoom y Ubicación ---------- */
function configurarZoom() {
    document.getElementById('btnZoomIn').addEventListener('click', () => mapa.zoomIn());
    document.getElementById('btnZoomOut').addEventListener('click', () => mapa.zoomOut());
}

function configurarUbicacion() {
    document.getElementById('btnLocate').addEventListener('click', () => {
        if (!navigator.geolocation) {
            mostrarToast('Geolocalización no soportada.');
            return;
        }
        mostrarToast('Obteniendo ubicación…');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                if (marcadorUbicacion) mapa.removeLayer(marcadorUbicacion);
                marcadorUbicacion = L.marker([latitude, longitude], {
                    icon: L.divIcon({
                        className: '',
                        html: '<span class="geo-marker"></span>',
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                    })
                }).addTo(mapa);
                mapa.setView([latitude, longitude], 15);
                mostrarToast('Ubicación encontrada');
            },
            () => mostrarToast('No se pudo obtener tu ubicación'),
            { enableHighAccuracy: true, timeout: 8000 }
        );
    });
}

function configurarCapas() {
    document.getElementById('btnLayers').addEventListener('click', () => {
        if (capaActual === 'clara') {
            mapa.removeLayer(capaClara);
            capaEstandar.addTo(mapa);
            capaActual = 'estandar';
            mostrarToast('Mapa estándar activado');
        } else {
            mapa.removeLayer(capaEstandar);
            capaClara.addTo(mapa);
            capaActual = 'clara';
            mostrarToast('Mapa claro activado');
        }
    });
}

function configurarSwap() {
    const btn = document.getElementById('btnSwap');
    const origen = document.getElementById('origen');
    const destino = document.getElementById('destino');

    btn.addEventListener('click', () => {
        const temp = origen.value;
        origen.value = destino.value;
        destino.value = temp;

        btn.classList.add('spun');
        setTimeout(() => btn.classList.remove('spun'), 200);

        calcularRuta();
    });
}

function configurarEnter() {
    ['origen', 'destino'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                calcularRuta();
                cerrarTodosLosPaneles();
            }
        });
    });
}

function configurarNavegar() {
    // El parámetro "true" indica que es una navegación real del usuario
    // (a diferencia de la ruta inicial que se calcula sola al cargar la página),
    // por eso solo aquí se registra el viaje en el historial.
    document.getElementById('btnNavigate').addEventListener('click', () => calcularRuta(true));
}

/* ---------- Recalcular precio si el usuario cambia de tarifa en Configuración ---------- */
function configurarCambioTarifa() {
    ['tarifaTipo', 'tarifaArvi'].forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        select.addEventListener('change', () => {
            const origen = document.getElementById('origen').value.trim();
            const destino = document.getElementById('destino').value.trim();
            if (origen && destino) calcularRuta();
        });
    });
}

/* =========================================================
   HISTORIAL DE VIAJES (por usuario, guardado en el backend)
   ========================================================= */

const API_BASE = '../PHP/'; // MAPA/ y PHP/ son carpetas hermanas dentro del proyecto

// Envía al backend el viaje que el usuario acaba de iniciar.
// Si la sesión expiró o hay un error de red, solo se avisa por consola:
// no debe interrumpir la experiencia de navegación en el mapa.
async function registrarViaje({ origen, destino, linea, minutos, costo }) {
    try {
        const res = await fetch(API_BASE + 'registrar_viaje.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin', // envía la cookie de sesión PHP
            body: JSON.stringify({ origen, destino, linea, minutos, costo })
        });
        const data = await res.json();
        if (!data.exito) {
            console.warn('No se pudo registrar el viaje:', data.mensaje);
        }
    } catch (err) {
        console.warn('Error de red al registrar el viaje:', err);
    }
}

// Pide al backend el historial + estadísticas del mes del usuario actual
// y actualiza la vista "Historial de viajes".
async function cargarHistorial() {
    const lista = document.getElementById('historyList');
    const vacio = document.getElementById('historyEmpty');
    if (!lista) return;

    try {
        const res = await fetch(API_BASE + 'historial.php', {
            method: 'GET',
            credentials: 'same-origin'
        });
        const data = await res.json();

        if (!data.exito) {
            lista.innerHTML = `<p class="history-empty">No se pudo cargar tu historial. Vuelve a iniciar sesión.</p>`;
            return;
        }

        // Estadísticas del mes
        const statViajes = document.getElementById('statViajesMes');
        const statTiempo = document.getElementById('statTiempoMes');
        const statCosto = document.getElementById('statCostoMes');
        if (statViajes) statViajes.textContent = data.stats.viajes_mes;
        if (statTiempo) statTiempo.textContent = `${data.stats.minutos_mes} min`;
        if (statCosto) statCosto.textContent = `$${formatearMiles(data.stats.costo_mes)} COP`;

        // Lista de viajes
        if (!data.viajes.length) {
            lista.innerHTML = '';
            if (vacio) { vacio.style.display = 'block'; lista.appendChild(vacio); }
            return;
        }

        lista.innerHTML = data.viajes.map(v => `
            <div class="history-item">
                <div class="history-icon ${colorPorLinea(v.linea)}"><i data-lucide="arrow-up-right"></i></div>
                <div class="history-info">
                    <h3>${v.estacion_origen} ➔ ${v.estacion_destino}</h3>
                    <p>${formatearFecha(v.fecha_hora)} • ${v.linea} • ${v.duracion_min} min</p>
                </div>
                <div class="history-price">
                    <span class="amount">-$${formatearMiles(v.costo)} COP</span>
                </div>
            </div>
        `).join('');

        if (window.lucide) lucide.createIcons();
    } catch (err) {
        lista.innerHTML = `<p class="history-empty">No se pudo conectar con el servidor.</p>`;
        console.warn('Error de red al cargar el historial:', err);
    }
}

function formatearMiles(numero) {
    return Number(numero).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatearFecha(fechaMysql) {
    const fecha = new Date(fechaMysql.replace(' ', 'T'));
    return fecha.toLocaleString('es-CO', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
}

function colorPorLinea(linea) {
    if (linea.includes('Metrocable') || linea.includes('Tranvía')) return 'purple';
    if (linea.includes('B')) return 'orange';
    return 'green';
}

/* =========================================================
   VISTA "USUARIO" (perfil editable de la cuenta en sesión)
   ========================================================= */

// Muestra la foto (si existe) o las iniciales de respaldo en un avatar dado.
function aplicarAvatar(imgId, fallbackId, fotoUrl, nombre) {
    const img = document.getElementById(imgId);
    const fallback = document.getElementById(fallbackId);
    if (fallback) fallback.textContent = obtenerIniciales(nombre);

    if (fotoUrl && img) {
        img.src = fotoUrl;
        img.style.display = 'block';
        if (fallback) fallback.style.display = 'none';
    } else {
        if (img) img.style.display = 'none';
        if (fallback) fallback.style.display = 'flex';
    }
}

// Pide al backend los datos de la cuenta y llena la vista "Usuario"
// (formulario editable) y el mini-perfil de la barra lateral.
async function cargarPerfil() {
    const vacio = document.getElementById('profileEmpty');

    try {
        const res = await fetch(API_BASE + 'perfil.php', {
            method: 'GET',
            credentials: 'same-origin'
        });
        const data = await res.json();

        if (!data.exito) {
            if (vacio) vacio.style.display = 'block';
            return;
        }
        if (vacio) vacio.style.display = 'none';

        const u = data.usuario;

        // Sidebar (mini-perfil)
        const nombreSidebar = document.getElementById('sidebarProfileName');
        if (nombreSidebar) nombreSidebar.textContent = u.nombre;
        aplicarAvatar('sidebarAvatarImg', 'sidebarAvatarFallback', u.foto_url, u.nombre);

        // Formulario de la vista "Usuario"
        const campoNombre = document.getElementById('profileNombre');
        const campoUsuario = document.getElementById('profileUsuarioTxt');
        const campoEmail = document.getElementById('profileEmail');
        if (campoNombre) campoNombre.value = u.nombre || '';
        if (campoUsuario) campoUsuario.value = u.usuario || '';
        if (campoEmail) campoEmail.value = u.email || '';
        aplicarAvatar('profileAvatarImg', 'profileAvatarFallback', u.foto_url, u.nombre);
    } catch (err) {
        if (vacio) { vacio.style.display = 'block'; vacio.textContent = 'No se pudo conectar con el servidor.'; }
        console.warn('Error de red al cargar el perfil:', err);
    }
}

// Toma hasta las dos primeras iniciales del nombre completo (ej. "Juan Pérez" -> "JP")
// para mostrarlas como foto de perfil provisional mientras no haya una foto real.
function obtenerIniciales(nombreCompleto) {
    const partes = (nombreCompleto || '').trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return '?';
    const primera = partes[0][0] || '';
    const segunda = partes.length > 1 ? (partes[1][0] || '') : '';
    return (primera + segunda).toUpperCase();
}

/* ---------- Vista "Usuario": vista previa de la foto + guardar cambios ---------- */
function configurarUsuario() {
    const inputFoto = document.getElementById('inputFoto');
    if (inputFoto) {
        inputFoto.addEventListener('change', () => {
            const archivo = inputFoto.files && inputFoto.files[0];
            if (!archivo) return;

            if (archivo.size > 2 * 1024 * 1024) {
                mostrarToast('La imagen debe pesar máximo 2MB');
                inputFoto.value = '';
                return;
            }

            // Vista previa inmediata mientras se sube (el guardado real ocurre al pulsar "Guardar cambios")
            const lector = new FileReader();
            lector.onload = (e) => {
                const img = document.getElementById('profileAvatarImg');
                const fallback = document.getElementById('profileAvatarFallback');
                if (img) { img.src = e.target.result; img.style.display = 'block'; }
                if (fallback) fallback.style.display = 'none';
            };
            lector.readAsDataURL(archivo);
        });
    }

    const btnGuardar = document.getElementById('btnGuardarPerfil');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', () => guardarPerfil());
    }
}

// Envía los datos del formulario (y la foto, si se eligió una) al backend
// para que queden guardados de verdad en la base de datos.
async function guardarPerfil() {
    const btnGuardar = document.getElementById('btnGuardarPerfil');
    const formData = new FormData();
    formData.append('nombre', document.getElementById('profileNombre').value.trim());
    formData.append('usuario', document.getElementById('profileUsuarioTxt').value.trim());
    formData.append('email', document.getElementById('profileEmail').value.trim());

    const inputFoto = document.getElementById('inputFoto');
    if (inputFoto && inputFoto.files && inputFoto.files[0]) {
        formData.append('foto', inputFoto.files[0]);
    }

    btnGuardar.disabled = true;
    try {
        const res = await fetch(API_BASE + 'actualizar_perfil.php', {
            method: 'POST',
            credentials: 'same-origin',
            body: formData
        });
        const data = await res.json();

        if (!data.exito) {
            mostrarToast(data.mensaje || 'No se pudieron guardar los cambios');
            return;
        }

        mostrarToast('Datos de usuario guardados');
        if (inputFoto) inputFoto.value = '';

        // Refleja de inmediato el nuevo nombre/foto en el mini-perfil del sidebar
        const u = data.usuario;
        const nombreSidebar = document.getElementById('sidebarProfileName');
        if (nombreSidebar) nombreSidebar.textContent = u.nombre;
        aplicarAvatar('sidebarAvatarImg', 'sidebarAvatarFallback', u.foto_url, u.nombre);
        aplicarAvatar('profileAvatarImg', 'profileAvatarFallback', u.foto_url, u.nombre);
    } catch (err) {
        mostrarToast('Error de red al guardar los cambios');
        console.warn('Error de red al guardar el perfil:', err);
    } finally {
        btnGuardar.disabled = false;
    }
}

/* =========================================================
   Buscador de estaciones: panel agrupado por línea, con la
   dirección de cada estación visible debajo del nombre.
   ========================================================= */

function cerrarTodosLosPaneles() {
    document.querySelectorAll('.station-dropdown').forEach(p => p.classList.remove('open'));
}

function renderizarOpcionesEstacion(panel, inputId, filtro) {
    panel.innerHTML = '';
    const q = normalizarTexto(filtro || '');
    let huboResultados = false;

    ORDEN_LINEAS.forEach(clave => {
        const linea = LINEAS[clave];
        if (!linea) return;

        const estacionesFiltradas = linea.estaciones.filter(e => !q || normalizarTexto(e.nombre).includes(q));
        if (!estacionesFiltradas.length) return;
        huboResultados = true;

        const grupo = document.createElement('div');
        grupo.className = 'station-group';

        const titulo = document.createElement('div');
        titulo.className = 'station-group-label';
        titulo.innerHTML = `<span class="station-group-dot" style="background:${linea.color};"></span>${ETIQUETAS_LINEA[clave] || clave.toUpperCase()}`;
        grupo.appendChild(titulo);

        estacionesFiltradas.forEach(estacion => {
            const opcion = document.createElement('button');
            opcion.type = 'button';
            opcion.className = 'station-option';
            opcion.innerHTML = `<span class="station-name">${estacion.nombre}</span>`
                + `<span class="station-address">${estacion.dir || 'Dirección no disponible'}</span>`;
            opcion.addEventListener('click', () => {
                const input = document.getElementById(inputId);
                input.value = estacion.nombre;
                cerrarTodosLosPaneles();
                calcularRuta();
            });
            grupo.appendChild(opcion);
        });

        panel.appendChild(grupo);
    });

    if (!huboResultados) {
        const vacio = document.createElement('div');
        vacio.className = 'station-empty';
        vacio.textContent = 'No se encontraron estaciones con ese nombre';
        panel.appendChild(vacio);
    }
}

function configurarAutocompletado() {
    ['origen', 'destino'].forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;

        // Ya no se usa el datalist nativo del navegador: el buscador propio
        // agrupa por línea y muestra la dirección de cada estación.
        input.removeAttribute('list');
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('placeholder', 'Escribe el nombre de una estación');

        const wrap = input.closest('.route-input-wrap');
        if (!wrap) return;

        const panel = document.createElement('div');
        panel.className = 'station-dropdown';
        panel.id = 'dropdown-' + id;
        wrap.appendChild(panel);

        input.addEventListener('focus', () => {
            renderizarOpcionesEstacion(panel, id, input.value);
            cerrarTodosLosPaneles();
            panel.classList.add('open');
        });

        input.addEventListener('input', () => {
            renderizarOpcionesEstacion(panel, id, input.value);
            panel.classList.add('open');
        });

        // Botón/flecha para expandir y ver todas las estaciones agrupadas
        // por línea, incluso si ya hay texto escrito en el campo.
        const toggleBtn = document.querySelector(`.station-dropdown-toggle[data-for="${id}"]`);
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const yaEstabaAbierto = panel.classList.contains('open');
                cerrarTodosLosPaneles();
                if (!yaEstabaAbierto) {
                    renderizarOpcionesEstacion(panel, id, '');
                    panel.classList.add('open');
                    toggleBtn.classList.add('spun');
                    input.focus();
                } else {
                    toggleBtn.classList.remove('spun');
                }
            });
        }
    });

    // Cerrar cualquier panel abierto al hacer clic fuera del campo de ruta
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.route-input-wrap')) {
            cerrarTodosLosPaneles();
            document.querySelectorAll('.station-dropdown-toggle').forEach(b => b.classList.remove('spun'));
        }
    });
}

/* ---------- Búsqueda de estaciones ---------- */
function normalizarTexto(txt) {
    return txt.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function buscarEstacion(texto) {
    const q = normalizarTexto(texto);
    if (!q) return null;
    const candidatas = listaEstacionesUnicas();

    return candidatas.find(e => normalizarTexto(e.nombre) === q)
        || candidatas.find(e => normalizarTexto(e.nombre).startsWith(q))
        || candidatas.find(e => normalizarTexto(e.nombre).includes(q))
        || null;
}

/* ---------- Grafo de la red y cálculo de ruta (BFS) ---------- */
// El grafo conecta estaciones consecutivas de cada línea. Cuando dos
// líneas comparten el nombre de una estación (ej. "San Antonio" en A,
// B y Tranvía), esa estación funciona automáticamente como transbordo,
// sin necesidad de reglas especiales por caso.
const GRAFO = new Map();
function agregarArista(nombreA, nombreB, lineaKey) {
    if (!GRAFO.has(nombreA)) GRAFO.set(nombreA, []);
    GRAFO.get(nombreA).push({ hacia: nombreB, linea: lineaKey });
}
// Se llama una sola vez, después de cargarRedMetro(), ya con LINEAS lista.
function construirGrafo() {
    Object.entries(LINEAS).forEach(([clave, linea]) => {
        const est = linea.estaciones;
        for (let i = 0; i < est.length - 1; i++) {
            agregarArista(est[i].nombre, est[i + 1].nombre, clave);
            agregarArista(est[i + 1].nombre, est[i].nombre, clave);
        }
    });
}

function encontrarRutaOptima(origenNombre, destinoNombre) {
    if (origenNombre === destinoNombre) return null;

    const visitados = new Set([origenNombre]);
    const cola = [{ nombre: origenNombre, camino: [origenNombre], lineas: [] }];

    while (cola.length) {
        const actual = cola.shift();
        if (actual.nombre === destinoNombre) return actual;

        const vecinos = GRAFO.get(actual.nombre) || [];
        for (const v of vecinos) {
            if (!visitados.has(v.hacia)) {
                visitados.add(v.hacia);
                cola.push({
                    nombre: v.hacia,
                    camino: [...actual.camino, v.hacia],
                    lineas: [...actual.lineas, v.linea]
                });
            }
        }
    }
    return null; // no hay conexión en la red
}

function contarTransbordos(lineas) {
    let cambios = 0;
    for (let i = 1; i < lineas.length; i++) {
        if (lineas[i] !== lineas[i - 1]) cambios++;
    }
    return cambios;
}

/* ---------- Construcción de segmentos por línea (para las indicaciones) ---------- */
// Agrupa el camino estación-a-estación en tramos continuos que usan la
// misma línea, para poder anunciar "toma la Línea X" una sola vez por
// tramo, en lugar de estación por estación.
function construirSegmentos(camino, lineas) {
    const segmentos = [];
    let inicio = 0;
    for (let i = 1; i < lineas.length; i++) {
        if (lineas[i] !== lineas[i - 1]) {
            segmentos.push({ linea: lineas[i - 1], desde: camino[inicio], hasta: camino[i] });
            inicio = i;
        }
    }
    segmentos.push({ linea: lineas[lineas.length - 1], desde: camino[inicio], hasta: camino[camino.length - 1] });
    return segmentos;
}

// Determina el destino/terminal hacia el que avanza un tramo (p. ej.
// "dirección Niquía"), comparando el orden de las estaciones dentro del
// arreglo oficial de esa línea.
function direccionDelTramo(claveLinea, estacionDesde, estacionSiguiente) {
    const estaciones = LINEAS[claveLinea].estaciones;
    const idxDesde = estaciones.findIndex(e => e.nombre === estacionDesde);
    const idxSig = estaciones.findIndex(e => e.nombre === estacionSiguiente);
    if (idxDesde === -1 || idxSig === -1) return estaciones[estaciones.length - 1].nombre;
    return idxSig > idxDesde ? estaciones[estaciones.length - 1].nombre : estaciones[0].nombre;
}

/* ---------- Render de las indicaciones paso a paso (panel derecho) ---------- */
function ocultarIndicaciones() {
    const placeholder = document.getElementById('directionsPlaceholder');
    const lista = document.getElementById('directionsList');
    if (placeholder) placeholder.style.display = 'flex';
    if (lista) { lista.classList.remove('show'); lista.innerHTML = ''; }
}

function renderizarIndicaciones(resultado, estacionOrigen, estacionDestino, coordsPorNombre) {
    const placeholder = document.getElementById('directionsPlaceholder');
    const lista = document.getElementById('directionsList');
    if (!lista) return;

    const segmentos = construirSegmentos(resultado.camino, resultado.lineas);
    const pasos = [];

    // Paso 1: punto de partida
    pasos.push({
        icono: 'map-pin',
        color: '#008037',
        titulo: 'Punto de partida',
        texto: `Comienza en la estación <b>${estacionOrigen.nombre}</b>.`,
        estacion: estacionOrigen.nombre
    });

    segmentos.forEach((seg, idx) => {
        const siguienteEstacion = resultado.camino[resultado.camino.indexOf(seg.desde) + 1] || seg.hasta;
        const info = infoDeLinea(seg.linea);
        const direccion = direccionDelTramo(seg.linea, seg.desde, siguienteEstacion);

        pasos.push({
            icono: 'navigation',
            color: info.color,
            titulo: `Toma la ${info.etiqueta}`,
            texto: `Desde <b>${seg.desde}</b>, dirección hacia <b>${direccion}</b>.`,
            estacion: seg.desde
        });

        const esUltimoSegmento = idx === segmentos.length - 1;
        if (!esUltimoSegmento) {
            pasos.push({
                icono: 'repeat',
                color: '#64748b',
                titulo: 'Haz transbordo',
                texto: `Baja en <b>${seg.hasta}</b> y cambia de línea.`,
                estacion: seg.hasta
            });
        }
    });

    // Último paso: destino final
    pasos.push({
        icono: 'flag',
        color: '#e0442f',
        titulo: '¡Has llegado!',
        texto: `Baja en <b>${estacionDestino.nombre}</b>. Ese es tu destino.`,
        estacion: estacionDestino.nombre
    });

    lista.innerHTML = pasos.map(paso => `
        <li class="direction-step" data-estacion="${paso.estacion}">
            <span class="direction-step-icon" style="background:${paso.color};">
                <i data-lucide="${paso.icono}"></i>
            </span>
            <div class="direction-step-body">
                <p class="direction-step-title">${paso.titulo}</p>
                <p class="direction-step-text">${paso.texto}</p>
            </div>
        </li>
    `).join('');

    if (placeholder) placeholder.style.display = 'none';
    lista.classList.add('show');
    if (window.lucide) lucide.createIcons();

    // Interactividad: al hacer clic en un paso, el mapa se centra en esa estación
    lista.querySelectorAll('.direction-step').forEach(item => {
        item.addEventListener('click', () => {
            const nombreEstacion = item.getAttribute('data-estacion');
            const est = coordsPorNombre.get(nombreEstacion);
            if (!est || !mapa) return;
            mapa.setView([est.lat, est.lon], 16, { animate: true });
            resaltarEstacionTemporal(est.lat, est.lon);
        });
    });
}

// Muestra un pulso temporal sobre la estación seleccionada en un paso
let marcadorResaltado = null;
function resaltarEstacionTemporal(lat, lon) {
    if (marcadorResaltado) mapa.removeLayer(marcadorResaltado);
    marcadorResaltado = L.marker([lat, lon], {
        icon: L.divIcon({
            className: '',
            html: '<span class="geo-marker"></span>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        })
    }).addTo(mapa);
    setTimeout(() => {
        if (marcadorResaltado) { mapa.removeLayer(marcadorResaltado); marcadorResaltado = null; }
    }, 2500);
}

function colocarMarcador(tipo, lat, lon) {
    if (tipo === 'origen') {
        if (marcadorOrigen) { marcadorOrigen.setLatLng([lat, lon]); return; }
        marcadorOrigen = L.marker([lat, lon], {
            icon: L.divIcon({
                className: '',
                html: '<span class="map-pin-dot"></span>',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            })
        }).addTo(mapa);
    } else {
        const svgPin = '<svg viewBox="0 0 24 24" width="30" height="30" fill="#e0442f" stroke="#fff" stroke-width="1.3">'
            + '<path d="M12 2C7.6 2 4 5.6 4 10c0 5.4 6.8 11.1 7.1 11.4.5.4 1.2.4 1.7 0C13.2 21.1 20 15.4 20 10c0-4.4-3.6-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/></svg>';
        if (marcadorDestino) { marcadorDestino.setLatLng([lat, lon]); return; }
        marcadorDestino = L.marker([lat, lon], {
            icon: L.divIcon({
                className: '',
                html: svgPin,
                iconSize: [30, 30],
                iconAnchor: [15, 29]
            })
        }).addTo(mapa);
    }
}

/* ---------- Cálculo de tarifa según el/los tipo(s) de línea usados ---------- */
// El Metro, Metrocable (K/H/J), Tranvía y Metroplús forman una sola red con
// tarifa integrada (se paga una vez, sin importar transbordos entre ellos).
// El Metrocable Arví (Línea L) tiene un esquema de precios independiente:
// si el viaje entra a Arví, esa parte se cobra aparte con la tarifa
// seleccionada en Configuración > "Tarifas Metrocable Arví".
function calcularTarifaViaje(lineasUsadas) {
    const usaArvi = lineasUsadas.includes('l');
    const usaRedIntegrada = lineasUsadas.some(l => l !== 'l');

    const selectTipo = document.getElementById('tarifaTipo');
    const selectArvi = document.getElementById('tarifaArvi');

    const tarifaIntegrada = selectTipo ? Number(selectTipo.value) : 3820;
    const tarifaArvi = selectArvi ? Number(selectArvi.value) : 3900;

    let total = 0;
    if (usaRedIntegrada) total += tarifaIntegrada;
    if (usaArvi) total += tarifaArvi;

    return { total, usaArvi, usaRedIntegrada };
}

async function calcularRuta(registrarViajeReal = false) {
    const campoOrigen = document.getElementById('origen');
    const campoDestino = document.getElementById('destino');
    const origenTexto = campoOrigen.value.trim();
    const destinoTexto = campoDestino.value.trim();
    const btnNavigate = document.getElementById('btnNavigate');

    if (!origenTexto || !destinoTexto) {
        mostrarToast('Ingresa una estación de origen y una de destino');
        ocultarIndicaciones();
        return;
    }

    btnNavigate.disabled = true;

    const estacionOrigen = buscarEstacion(origenTexto);
    const estacionDestino = buscarEstacion(destinoTexto);

    if (!estacionOrigen) {
        mostrarToast(`"${origenTexto}" no es una estación del sistema`);
        btnNavigate.disabled = false;
        ocultarIndicaciones();
        return;
    }
    if (!estacionDestino) {
        mostrarToast(`"${destinoTexto}" no es una estación del sistema`);
        btnNavigate.disabled = false;
        ocultarIndicaciones();
        return;
    }

    const resultado = encontrarRutaOptima(estacionOrigen.nombre, estacionDestino.nombre);
    if (!resultado || resultado.camino.length < 2) {
        mostrarToast('No hay una ruta directa entre esas estaciones');
        btnNavigate.disabled = false;
        ocultarIndicaciones();
        return;
    }

    const coordsPorNombre = new Map(listaEstacionesUnicas().map(e => [e.nombre, e]));
    const tramo = resultado.camino.map(nombre => coordsPorNombre.get(nombre));

    colocarMarcador('origen', estacionOrigen.lat, estacionOrigen.lon);
    colocarMarcador('destino', estacionDestino.lat, estacionDestino.lon);

    if (lineaRuta) mapa.removeLayer(lineaRuta);
    lineaRuta = L.polyline(tramo.map(e => [e.lat, e.lon]), {
        color: '#008037',
        weight: 5,
        opacity: 0.9,
        dashArray: '1 12',
        lineCap: 'round'
    }).addTo(mapa);

    const transbordos = contarTransbordos(resultado.lineas);
    const numTramos = tramo.length - 1;
    const minutos = Math.max(1, numTramos * 2 + transbordos * 4);
    document.getElementById('summaryTime').textContent = minutos;
    document.getElementById('summaryBar').style.width = Math.min(100, minutos * 4) + '%';

    const { total: costoViaje, usaArvi } = calcularTarifaViaje(resultado.lineas);
    document.getElementById('summaryCost').textContent = formatearMiles(costoViaje);

    const limites = L.latLngBounds(tramo.map(e => [e.lat, e.lon]));
    mapa.fitBounds(limites, { padding: [90, 90] });

    const sufijoTransbordo = transbordos > 0 ? ` (${transbordos} transbordo${transbordos > 1 ? 's' : ''})` : '';
    const sufijoArvi = usaArvi ? ' • incluye tarifa especial Metrocable Arví' : '';
    mostrarToast(`Ruta lista: ${estacionOrigen.nombre} ➔ ${estacionDestino.nombre}${sufijoTransbordo}${sufijoArvi}`);
    renderizarIndicaciones(resultado, estacionOrigen, estacionDestino, coordsPorNombre);
    btnNavigate.disabled = false;

    // Solo se guarda en el historial cuando el usuario pulsa "Iniciar Navegación",
    // no cuando la ruta inicial se calcula sola al cargar la página.
    if (registrarViajeReal) {
        const lineasUsadas = [...new Set(resultado.lineas.map(l => infoDeLinea(l).etiqueta))].join(' + ');
        registrarViaje({
            origen: estacionOrigen.nombre,
            destino: estacionDestino.nombre,
            linea: lineasUsadas,
            minutos,
            costo: costoViaje
        });
    }
}

/* ---------- Toast ---------- */
let toastTimer = null;
function mostrarToast(mensaje) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = mensaje;
    toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}