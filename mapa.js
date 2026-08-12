// mapa.js — Proyecto SUM (Sistema de Ubicación Metro)
// Incluye: Mapa Interactivo, Navegación de Vistas, Trip History
// y Sistema interactivo de Recarga de Saldo Cívica.

const MEDELLIN_CENTRO = [6.2442, -75.5812];

let mapa, capaClara, capaEstandar, capaActual = 'clara';
let marcadorOrigen, marcadorDestino, marcadorUbicacion, lineaRuta;
const capasMetro = {};
let saldoActual = 18500;

document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();

    inicializarMapa();
    dibujarLineasMetro();

    configurarZoom();
    configurarUbicacion();
    configurarCapas();
    configurarSwap();
    configurarNavegar();
    configurarLeyenda();
    configurarEnter();
    
    // Navegación entre pestañas (Trip History, Balance, etc.)
    configurarNavegacionMenu();

    // Ruta inicial
    calcularRuta();
});

/* ---------- Cambiar entre Vistas / Pestañas ---------- */
function configurarNavegacionMenu() {
    const navItems = document.querySelectorAll('.dash-nav-item');
    const views = document.querySelectorAll('.dash-view');
    const btnSidebarRecharge = document.getElementById('btnSidebarRecharge');

    function cambiarVista(targetId) {
        if (!targetId) return;

        // 1. Ocultar todas las vistas
        views.forEach(v => v.classList.remove('active'));

        // 2. Mostrar la vista seleccionada
        const targetView = document.getElementById(targetId);
        if (targetView) {
            targetView.classList.add('active');

            // Actualizar el estado 'active' en la barra lateral
            navItems.forEach(item => {
                if (item.getAttribute('data-target') === targetId) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            // Reajustar el mapa de Leaflet al regresar al Dashboard
            if (targetId === 'view-dashboard' && mapa) {
                setTimeout(() => mapa.invalidateSize(), 150);
            }

            // Recargar íconos Lucide
            if (window.lucide) lucide.createIcons();
        }
    }

    // Clics en el menú lateral
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const target = item.getAttribute('data-target');
            if (target) {
                e.preventDefault();
                cambiarVista(target);
            }
        });
    });

    // Enlace de horarios detallados
    const linkViewSchedule = document.getElementById('linkViewSchedule');
    if (linkViewSchedule) {
        linkViewSchedule.addEventListener('click', (e) => {
            e.preventDefault();
            mostrarToast('Horarios: Línea A opera de 04:30 AM a 11:00 PM.');
        });
    }
}

/* ---------- Mapa Leaflet ---------- */
function inicializarMapa() {
    mapa = L.map('leafletMap', {
        zoomControl: false,
        attributionControl: true
    }).setView(MEDELLIN_CENTRO, 13);

    capaClara = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19
    }).addTo(mapa);

    capaEstandar = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    });

    setTimeout(() => mapa.invalidateSize(), 200);
}

/* ---------- Dibujar Líneas Metro ---------- */
function dibujarLineasMetro() {
    const lineaA = [
        [6.3432, -75.5564], [6.3050, -75.5613], [6.2814, -75.5661],
        [6.2610, -75.5697], [6.2442, -75.5720], [6.2298, -75.5714],
        [6.2088, -75.5735], [6.1930, -75.5900], [6.1783, -75.5921],
        [6.1728, -75.6076], [6.1587, -75.6428]
    ];
    const lineaB = [
        [6.2442, -75.5720], [6.2500, -75.5790], [6.2568, -75.5870],
        [6.2593, -75.5992]
    ];
    const tranvia = [
        [6.2442, -75.5720], [6.2470, -75.5610], [6.2497, -75.5520]
    ];

    capasMetro.a = L.polyline(lineaA, { color: '#2563eb', weight: 4, opacity: 0.8 }).addTo(mapa);
    capasMetro.b = L.polyline(lineaB, { color: '#f5a623', weight: 4, opacity: 0.8 }).addTo(mapa);
    capasMetro.tranvia = L.polyline(tranvia, { color: '#7c3aed', weight: 4, opacity: 0.8, dashArray: '2 8' }).addTo(mapa);
}

function configurarLeyenda() {
    document.querySelectorAll('.legend-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const clave = pill.dataset.line;
            const capa = capasMetro[clave];
            if (!capa) return;

            if (mapa.hasLayer(capa)) {
                mapa.removeLayer(capa);
                pill.classList.add('inactive');
            } else {
                capa.addTo(mapa);
                pill.classList.remove('inactive');
            }
        });
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
            }
        });
    });
}

function configurarNavegar() {
    document.getElementById('btnNavigate').addEventListener('click', calcularRuta);
}

/* ---------- Geocodificación y Cálculo de Ruta ---------- */
async function geocodificar(texto) {
    const url = 'https://nominatim.openstreetmap.org/search'
        + '?format=json&limit=1&accept-language=es'
        + '&viewbox=-75.70,6.10,-75.45,6.40&bounded=1'
        + '&q=' + encodeURIComponent(texto + ', Medellín, Colombia');

    const res = await fetch(url);
    if (!res.ok) throw new Error('Error de geocodificación');
    const datos = await res.json();
    if (!datos.length) return null;

    return {
        lat: parseFloat(datos[0].lat),
        lon: parseFloat(datos[0].lon),
        nombre: datos[0].display_name
    };
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

async function trazarRuta(origenGeo, destinoGeo) {
    const url = `https://router.project-osrm.org/route/v1/driving/${origenGeo.lon},${origenGeo.lat};${destinoGeo.lon},${destinoGeo.lat}?overview=full&geometries=geojson`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Error de ruteo');
    const datos = await res.json();
    if (!datos.routes || !datos.routes.length) throw new Error('Sin ruta disponible');

    const ruta = datos.routes[0];
    const coords = ruta.geometry.coordinates.map(c => [c[1], c[0]]);

    if (lineaRuta) mapa.removeLayer(lineaRuta);
    lineaRuta = L.polyline(coords, {
        color: '#008037',
        weight: 5,
        opacity: 0.9,
        dashArray: '1 12',
        lineCap: 'round'
    }).addTo(mapa);

    const minutos = Math.max(1, Math.round(ruta.duration / 60));
    document.getElementById('summaryTime').textContent = minutos;
    document.getElementById('summaryBar').style.width = Math.min(100, minutos * 4) + '%';
}

async function calcularRuta() {
    const campoOrigen = document.getElementById('origen');
    const campoDestino = document.getElementById('destino');
    const origenTexto = campoOrigen.value.trim();
    const destinoTexto = campoDestino.value.trim();
    const btnNavigate = document.getElementById('btnNavigate');

    if (!origenTexto || !destinoTexto) {
        mostrarToast('Ingresa un origen y un destino');
        return;
    }

    btnNavigate.disabled = true;
    mostrarToast('Buscando ruta…');

    try {
        const [origenGeo, destinoGeo] = await Promise.all([
            geocodificar(origenTexto),
            geocodificar(destinoTexto)
        ]);

        if (!origenGeo) { mostrarToast(`No se encontró "${origenTexto}"`); return; }
        if (!destinoGeo) { mostrarToast(`No se encontró "${destinoTexto}"`); return; }

        colocarMarcador('origen', origenGeo.lat, origenGeo.lon);
        colocarMarcador('destino', destinoGeo.lat, destinoGeo.lon);

        await trazarRuta(origenGeo, destinoGeo);

        const limites = L.latLngBounds(
            [origenGeo.lat, origenGeo.lon],
            [destinoGeo.lat, destinoGeo.lon]
        );
        mapa.fitBounds(limites, { padding: [90, 90] });

        mostrarToast(`Ruta lista: ${origenTexto} ➔ ${destinoTexto}`);
    } catch (err) {
        console.error(err);
        mostrarToast('No se pudo calcular la ruta. Revisa tu conexión.');
    } finally {
        btnNavigate.disabled = false;
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