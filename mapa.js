// mapa.js — Proyecto SUM (Sistema de Ubicación Metro)
// Incluye: Mapa Interactivo, Navegación de Vistas e Historial de Viajes.

const MEDELLIN_CENTRO = [6.2472, -75.5697]; // San Antonio: corazón del sistema (A + B + Tranvía)

let mapa, capaClara, capaEstandar, capaActual = 'clara';
let marcadorOrigen, marcadorDestino, marcadorUbicacion, lineaRuta;
const capasMetro = {};

// ⚠️ Reemplaza TU_CLAVE_AQUI por la clave real que te envió CARTO
// (correo de support-basemaps@carto.com, asunto "Tu clave API de CARTO Basemaps")
const CARTO_API_KEY = 'cb1_2883_1_32f0bf1288bfd12fd81c1134';

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
    
    // Navegación entre pestañas (Panel, Historial, Configuración, Soporte)
    configurarNavegacionMenu();

    // Ruta inicial
    calcularRuta();
});

/* ---------- Cambiar entre Vistas / Pestañas ---------- */
function configurarNavegacionMenu() {
    const navItems = document.querySelectorAll('.dash-nav-item');
    const views = document.querySelectorAll('.dash-view');

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
}

/* ---------- Mapa Leaflet ---------- */
function inicializarMapa() {
    mapa = L.map('leafletMap', {
        zoomControl: false,
        attributionControl: true
    }).setView(MEDELLIN_CENTRO, 13);

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

/* ---------- Dibujar Líneas Metro y Estaciones ---------- */
// Coordenadas reales (o muy cercanas) de cada estación, tomadas de las
// fichas oficiales de cada estación. Antes las líneas usaban puntos
// aproximados a mano que quedaban desviadas del trazado real (sobre todo
// en el tramo sur de la Línea A y en el extremo occidental de la Línea B),
// y no existían marcadores individuales por estación.
const ESTACIONES_A = [
    { nombre: 'Niquía',        lat: 6.33778, lon: -75.54444 },
    { nombre: 'Bello',         lat: 6.33028, lon: -75.55361 },
    { nombre: 'Madera',        lat: 6.31583, lon: -75.55542 },
    { nombre: 'Acevedo',       lat: 6.30028, lon: -75.55847 },
    { nombre: 'Tricentenario', lat: 6.28930, lon: -75.56400 },
    { nombre: 'Caribe',        lat: 6.27833, lon: -75.56944 },
    { nombre: 'Universidad',   lat: 6.26944, lon: -75.56583 },
    { nombre: 'Hospital',      lat: 6.26389, lon: -75.56600 }, // corregido: iba desviada al oriente, rompiendo el tramo recto Universidad→Industriales sobre la Cra. 51 (Bolívar)
    { nombre: 'Prado',         lat: 6.25694, lon: -75.56611 },
    { nombre: 'Parque Berrío', lat: 6.25028, lon: -75.56833 },
    { nombre: 'San Antonio',   lat: 6.24722, lon: -75.56972 },
    { nombre: 'Alpujarra',     lat: 6.24306, lon: -75.57139 },
    { nombre: 'Exposiciones',  lat: 6.23861, lon: -75.57306 },
    { nombre: 'Industriales',  lat: 6.23000, lon: -75.57556 },
    { nombre: 'Poblado',       lat: 6.21222, lon: -75.57806 },
    { nombre: 'Aguacatala',    lat: 6.19417, lon: -75.58167 },
    { nombre: 'Ayurá',         lat: 6.18611, lon: -75.58611 },
    { nombre: 'Envigado',      lat: 6.17139, lon: -75.60056 }, // corregido con coordenada verificada (la ficha inglesa de Wikipedia estaba desactualizada)
    { nombre: 'Itagüí',        lat: 6.16294, lon: -75.60671 }, // corregido con coordenada verificada (antes era una estimación por interpolación)
    { nombre: 'Sabaneta',      lat: 6.15780, lon: -75.61610 },
    { nombre: 'La Estrella',   lat: 6.15267, lon: -75.62656 } // corregido con coordenada verificada (antes era una estimación)
];

const ESTACIONES_B = [
    { nombre: 'San Antonio',  lat: 6.24722, lon: -75.56972 },
    { nombre: 'Cisneros',     lat: 6.24917, lon: -75.57528 },
    { nombre: 'Suramericana', lat: 6.25306, lon: -75.58306 },
    { nombre: 'Estadio',      lat: 6.25600, lon: -75.59000 },
    { nombre: 'Floresta',     lat: 6.25861, lon: -75.59778 },
    { nombre: 'Santa Lucía',  lat: 6.25700, lon: -75.60600 },
    { nombre: 'San Javier',   lat: 6.25694, lon: -75.61389 }
];

// Nota: para el Tranvía de Ayacucho solo se ubican con precisión los dos
// extremos (San Antonio y Oriente); las estaciones intermedias (San José,
// Bicentenario, Buenos Aires, Miraflores, Loyola, Alejandro Echavarría) no
// se marcan individualmente por no contar aún con coordenadas verificadas.
const ESTACIONES_TRANVIA = [
    { nombre: 'San Antonio', lat: 6.24722, lon: -75.56972 },
    { nombre: 'Oriente',     lat: 6.24970, lon: -75.55200 }
];

function crearMarcadorEstacion(estacion, color) {
    const esTransbordo = estacion.nombre === 'San Antonio';
    return L.circleMarker([estacion.lat, estacion.lon], {
        radius: esTransbordo ? 7 : 5,
        weight: esTransbordo ? 3 : 2,
        color: '#ffffff',
        fillColor: color,
        fillOpacity: 1
    }).bindTooltip(estacion.nombre + (esTransbordo ? ' (transbordo)' : ''), { direction: 'top', offset: [0, -6] });
}

function dibujarLineasMetro() {
    const colorA = '#2563eb';
    const colorB = '#f5a623';
    const colorTranvia = '#7c3aed';

    const polilineaA = L.polyline(
        ESTACIONES_A.map(e => [e.lat, e.lon]),
        { color: colorA, weight: 4, opacity: 0.8 }
    );
    const polilineaB = L.polyline(
        ESTACIONES_B.map(e => [e.lat, e.lon]),
        { color: colorB, weight: 4, opacity: 0.8 }
    );
    const polilineaTranvia = L.polyline(
        ESTACIONES_TRANVIA.map(e => [e.lat, e.lon]),
        { color: colorTranvia, weight: 4, opacity: 0.8, dashArray: '2 8' }
    );

    const marcadoresA = ESTACIONES_A.map(e => crearMarcadorEstacion(e, colorA));
    const marcadoresB = ESTACIONES_B.map(e => crearMarcadorEstacion(e, colorB));
    const marcadoresTranvia = ESTACIONES_TRANVIA.map(e => crearMarcadorEstacion(e, colorTranvia));

    // Cada línea queda agrupada junto con sus estaciones, así la leyenda
    // (configurarLeyenda) puede mostrar/ocultar ambas cosas a la vez.
    capasMetro.a = L.layerGroup([polilineaA, ...marcadoresA]).addTo(mapa);
    capasMetro.b = L.layerGroup([polilineaB, ...marcadoresB]).addTo(mapa);
    capasMetro.tranvia = L.layerGroup([polilineaTranvia, ...marcadoresTranvia]).addTo(mapa);
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
