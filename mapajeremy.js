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

document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();

    inicializarMapa();
    dibujarRedCompleta();

    configurarZoom();
    configurarUbicacion();
    configurarCapas();
    configurarSwap();
    configurarNavegar();
    configurarLeyenda();
    configurarEnter();
    configurarAutocompletado();

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
   RED COMPLETA DEL SISTEMA (datos reales, fuente GTFS oficial)
   Cada estación incluye "dir": la dirección de acceso a la estación.
   ========================================================= */

// Metro — Línea A (Niquía ↔ La Estrella)
const ESTACIONES_A = [
    { nombre: 'Niquía', lat: 6.33788, lon: -75.54433, dir: 'Diagonal 50A # 37-01, Bello' },
    { nombre: 'Bello', lat: 6.32989, lon: -75.55375, dir: 'Calle 44 # 46-001, Bello' },
    { nombre: 'Madera', lat: 6.31603, lon: -75.55534, dir: 'Carrera 49 # 25B-20, Bello' },
    { nombre: 'Acevedo', lat: 6.29986, lon: -75.55853, dir: 'Carrera 63 # 103G-202 (acceso norte), Medellín' },
    { nombre: 'Tricentenario', lat: 6.29031, lon: -75.56473, dir: 'Carrera 63 # 94A-518 (acceso norte), Medellín' },
    { nombre: 'Caribe', lat: 6.27828, lon: -75.56937, dir: 'Carrera 64 # 75B-600 (acceso norte), Medellín' },
    { nombre: 'Universidad', lat: 6.26933, lon: -75.56577, dir: 'Calle 73 # 52-40, Medellín' },
    { nombre: 'Hospital', lat: 6.26368, lon: -75.56344, dir: 'Carrera 51 # 65-85, Medellín' },
    { nombre: 'Prado', lat: 6.25679, lon: -75.56605, dir: 'Carrera 51D # 57-100, Medellín' },
    { nombre: 'Parque Berrío', lat: 6.25054, lon: -75.56828, dir: 'Carrera 51 con Calle 50 (aprox.), Medellín' },
    { nombre: 'San Antonio', lat: 6.24707, lon: -75.56969, dir: 'Carrera 51 con Calle 46, Medellín' },
    { nombre: 'Alpujarra', lat: 6.24292, lon: -75.57136, dir: 'Carrera 51 # 41-43, Medellín' },
    { nombre: 'Exposiciones', lat: 6.23843, lon: -75.57322, dir: 'Carrera 51 con Calle 37, Medellín' },
    { nombre: 'Industriales', lat: 6.23002, lon: -75.57561, dir: 'Carrera 49 # 24-435, Medellín' },
    { nombre: 'Poblado', lat: 6.21196, lon: -75.57806, dir: 'Avenida El Poblado, sector Astorga (aprox.), Medellín' },
    { nombre: 'Aguacatala', lat: 6.19377, lon: -75.58192, dir: 'Carrera 48C # 12 Sur-50, Medellín' },
    { nombre: 'Ayurá', lat: 6.18601, lon: -75.5862, dir: 'Avenida Regional con Calle 32 Sur (aprox.), Envigado' },
    { nombre: 'Envigado', lat: 6.17469, lon: -75.59706, dir: 'Carrera 42 # 59A-291, Envigado' },
    { nombre: 'Itagüí', lat: 6.16296, lon: -75.60671, dir: 'Carrera 49 # 50 Sur-80, Itagüí' },
    { nombre: 'Sabaneta', lat: 6.15789, lon: -75.61604, dir: 'Carrera 49 # 67 Sur, Sabaneta' },
    { nombre: 'La Estrella', lat: 6.15263, lon: -75.62646, dir: 'Carrera 49 # 77 Sur, La Estrella' }
];

// Metro — Línea B (San Antonio ↔ San Javier)
const ESTACIONES_B = [
    { nombre: 'San Antonio', lat: 6.24715, lon: -75.56968, dir: 'Carrera 51 con Calle 46, Medellín' },
    { nombre: 'Cisneros', lat: 6.24901, lon: -75.57511, dir: 'Carrera 57 # 45A-50, Medellín' },
    { nombre: 'Suramericana', lat: 6.253, lon: -75.58302, dir: 'Carrera 65 con Calle 44 (aprox.), Medellín' },
    { nombre: 'Estadio', lat: 6.25332, lon: -75.58824, dir: 'Carrera 70 # 47D-15, Medellín' },
    { nombre: 'Floresta', lat: 6.2587, lon: -75.5977, dir: 'Carrera 80 # 47D-30, Medellín' },
    { nombre: 'Santa Lucía', lat: 6.25806, lon: -75.60377, dir: 'Calle 47DD # 86-53, Medellín' },
    { nombre: 'San Javier', lat: 6.25686, lon: -75.61378, dir: 'Carrera 99 # 45-26, Medellín' }
];

// Tranvía de Ayacucho (San Antonio ↔ Oriente) — con todas las estaciones intermedias
const ESTACIONES_TRANVIA = [
    { nombre: 'San Antonio', lat: 6.247, lon: -75.56913, dir: 'Carrera 51 con Calle 46, Medellín' },
    { nombre: 'San José', lat: 6.24737, lon: -75.5655, dir: 'Avenida Oriental con Calle 49 (aprox.), Medellín' },
    { nombre: 'Pabellón del Agua', lat: 6.24555, lon: -75.56182, dir: 'Avenida Ayacucho, barrio Barrio Colón (aprox.), Medellín' },
    { nombre: 'Bicentenario', lat: 6.24386, lon: -75.55853, dir: 'Avenida Ayacucho, barrio Boston (aprox.), Medellín' },
    { nombre: 'Buenos Aires', lat: 6.2415, lon: -75.55389, dir: 'Avenida Ayacucho con Carrera 29 (aprox.), Medellín' },
    { nombre: 'Miraflores', lat: 6.24148, lon: -75.54907, dir: 'Avenida Ayacucho, barrio Miraflores (aprox.), Medellín' },
    { nombre: 'Loyola', lat: 6.23924, lon: -75.54524, dir: 'Avenida Ayacucho, barrio Loyola (aprox.), Medellín' },
    { nombre: 'Alejandro Echavarría', lat: 6.2354, lon: -75.54153, dir: 'Barrio Alejandro Echavarría (aprox.), Medellín' },
    { nombre: 'Oriente', lat: 6.23304, lon: -75.54001, dir: 'Barrio Oriente, comuna 8 (aprox.), Medellín' }
];

// Metrocable — Línea K (Acevedo ↔ Santo Domingo)
const ESTACIONES_K = [
    { nombre: 'Acevedo', lat: 6.30025, lon: -75.55827, dir: 'Carrera 63 # 103G-202 (acceso norte), Medellín' },
    { nombre: 'Andalucía', lat: 6.29618, lon: -75.55193, dir: 'Carrera 46A # 107-3, Medellín' },
    { nombre: 'Popular', lat: 6.29513, lon: -75.54815, dir: 'Carrera 42B # 107-61, Medellín' },
    { nombre: 'Santo Domingo', lat: 6.29316, lon: -75.54172, dir: 'Carrera 51A # 46-08, Medellín' }
];

// Metrocable — Línea L (Santo Domingo ↔ Arví)
const ESTACIONES_L = [
    { nombre: 'Santo Domingo', lat: 6.29274, lon: -75.5419, dir: 'Carrera 51A # 46-08, Medellín' },
    { nombre: 'Arví', lat: 6.28153, lon: -75.50293, dir: 'Parque Arví, vereda Piedras Blancas, Santa Elena (aprox.), Medellín' }
];

// Metrocable — Línea H (Oriente ↔ Villa Sierra)
const ESTACIONES_H = [
    { nombre: 'Oriente', lat: 6.2332, lon: -75.54, dir: 'Barrio Oriente, comuna 8 (aprox.), Medellín' },
    { nombre: 'Las Torres', lat: 6.23655, lon: -75.53628, dir: 'Barrio Las Torres, comuna 8 (aprox.), Medellín' },
    { nombre: 'Villa Sierra', lat: 6.23499, lon: -75.52864, dir: 'Barrio La Sierra, comuna 8 (aprox.), Medellín' }
];

// Metrocable — Línea J (San Javier ↔ La Aurora)
const ESTACIONES_J = [
    { nombre: 'San Javier', lat: 6.25679, lon: -75.61341, dir: 'Carrera 99 # 45-26, Medellín' },
    { nombre: 'Juan XXIII', lat: 6.26569, lon: -75.61369, dir: 'Carrera 99CD con Calle 48B, Medellín' },
    { nombre: 'Vallejuelos', lat: 6.27538, lon: -75.61402, dir: 'Calle 61B con Carrera 104, Medellín' },
    { nombre: 'La Aurora', lat: 6.2811, lon: -75.61421, dir: 'Calle 64 con Carrera 104, Medellín' }
];

// Metroplús — Línea 1 (Universidad de Medellín ↔ Parque de Aranjuez, por Av. Ferrocarril)
const ESTACIONES_MP1 = [
    { nombre: 'U. de M.', lat: 6.2306, lon: -75.60913, dir: 'Carrera 87B con Calle 30A, Medellín' },
    { nombre: 'Los Alpes', lat: 6.23103, lon: -75.60506, dir: 'Carrera 84 con Calle 30A, Medellín' },
    { nombre: 'La Palma', lat: 6.2311, lon: -75.60106, dir: 'Carrera 81 con Calle 30A, Medellín' },
    { nombre: 'Parque Belén', lat: 6.23133, lon: -75.59675, dir: 'Carrera 76 con Calle 30A, Medellín' },
    { nombre: 'Rosales', lat: 6.23153, lon: -75.59096, dir: 'Carrera 73 con Calle 30A, Medellín' },
    { nombre: 'Fátima', lat: 6.2316, lon: -75.58655, dir: 'Carrera 70 con Calle 30A, Medellín' },
    { nombre: 'Nutibara', lat: 6.23171, lon: -75.58206, dir: 'Carrera 65 con Avenida 33, Medellín' },
    { nombre: 'Industriales', lat: 6.23022, lon: -75.57652, dir: 'Avenida Ferrocarril con Calle 30, Medellín' },
    { nombre: 'Plaza Mayor', lat: 6.2437, lon: -75.57529, dir: 'Calle 41 con Carrera 52 (aprox.), Medellín' },
    { nombre: 'Cisneros', lat: 6.24874, lon: -75.57503, dir: 'Carrera 57 # 45A-50, Medellín' },
    { nombre: 'Minorista', lat: 6.2561, lon: -75.57312, dir: 'Carrera 57 # 54-01, Medellín' },
    { nombre: 'Chagualo', lat: 6.26073, lon: -75.56913, dir: 'Carrera 55 con Calle 65 (aprox.), Medellín' },
    { nombre: 'Ruta N - U. de A.', lat: 6.26355, lon: -75.56764, dir: 'Carrera 55 # 65-01, Medellín' },
    { nombre: 'Hospital', lat: 6.26383, lon: -75.56313, dir: 'Carrera 51 # 65-85, Medellín' },
    { nombre: 'San Pedro', lat: 6.26339, lon: -75.56017, dir: 'Carrera 51 con Calle 68 (aprox.), Medellín' }, // fuera de servicio operativo actualmente
    { nombre: 'Palos Verdes', lat: 6.26208, lon: -75.55581, dir: 'Carrera 45 # 66-01, Medellín' },
    { nombre: 'Gardel', lat: 6.26768, lon: -75.55495, dir: 'Carrera 45 con Calle 70 (aprox.), Medellín' },
    { nombre: 'Manrique', lat: 6.27322, lon: -75.55401, dir: 'Carrera 45 con Calle 73 (aprox.), Medellín' },
    { nombre: 'Las Esmeraldas', lat: 6.27838, lon: -75.55312, dir: 'Carrera 45 con Calle 78 (aprox.), Medellín' },
    { nombre: 'Berlín', lat: 6.28287, lon: -75.55285, dir: 'Carrera 45 con Calle 83 (aprox.), Medellín' },
    { nombre: 'Parque Aranjuez', lat: 6.28519, lon: -75.55663, dir: 'Carrera 49A # 93-00, Medellín' }
];

// Metroplús — Línea 2 (Universidad de Medellín ↔ Parque de Aranjuez, por Av. Oriental)
const ESTACIONES_MP2 = [
    { nombre: 'U. de M.', lat: 6.2306, lon: -75.60913, dir: 'Carrera 87B con Calle 30A, Medellín' },
    { nombre: 'Los Alpes', lat: 6.23103, lon: -75.60506, dir: 'Carrera 84 con Calle 30A, Medellín' },
    { nombre: 'La Palma', lat: 6.2311, lon: -75.60106, dir: 'Carrera 81 con Calle 30A, Medellín' },
    { nombre: 'Parque Belén', lat: 6.23133, lon: -75.59675, dir: 'Carrera 76 con Calle 30A, Medellín' },
    { nombre: 'Rosales', lat: 6.23153, lon: -75.59096, dir: 'Carrera 73 con Calle 30A, Medellín' },
    { nombre: 'Fátima', lat: 6.2316, lon: -75.58655, dir: 'Carrera 70 con Calle 30A, Medellín' },
    { nombre: 'Nutibara', lat: 6.23171, lon: -75.58206, dir: 'Carrera 65 con Avenida 33, Medellín' },
    { nombre: 'Industriales', lat: 6.23022, lon: -75.57652, dir: 'Avenida Ferrocarril con Calle 30, Medellín' },
    { nombre: 'Barrio Colombia', lat: 6.22864, lon: -75.571, dir: 'Carrera 52 con Calle 30 (aprox.), Medellín' },
    { nombre: 'Barrio San Diego', lat: 6.23358, lon: -75.57002, dir: 'Carrera 46 con Calle 34 (aprox.), Medellín' },
    { nombre: 'Barrio Colón', lat: 6.24057, lon: -75.56971, dir: 'Carrera 45 con Calle 44 (aprox.), Medellín' },
    { nombre: 'San José', lat: 6.24658, lon: -75.56644, dir: 'Avenida Oriental con Calle 49 (aprox.), Medellín' },
    { nombre: 'La Playa', lat: 6.24933, lon: -75.56446, dir: 'Carrera 45 con Avenida La Playa (aprox.), Medellín' },
    { nombre: 'Catedral Metropolitana', lat: 6.25293, lon: -75.56238, dir: 'Parque Bolívar (aprox.), Medellín' },
    { nombre: 'Prado', lat: 6.25783, lon: -75.56551, dir: 'Carrera 51 con Calle 57 (aprox.), Medellín' },
    { nombre: 'Hospital', lat: 6.26293, lon: -75.56356, dir: 'Carrera 51 # 65-85, Medellín' },
    { nombre: 'San Pedro', lat: 6.26339, lon: -75.56017, dir: 'Carrera 51 con Calle 68 (aprox.), Medellín' },
    { nombre: 'Palos Verdes', lat: 6.26208, lon: -75.55581, dir: 'Carrera 45 # 66-01, Medellín' },
    { nombre: 'Gardel', lat: 6.26768, lon: -75.55495, dir: 'Carrera 45 con Calle 70 (aprox.), Medellín' },
    { nombre: 'Manrique', lat: 6.27322, lon: -75.55401, dir: 'Carrera 45 con Calle 73 (aprox.), Medellín' },
    { nombre: 'Las Esmeraldas', lat: 6.27838, lon: -75.55312, dir: 'Carrera 45 con Calle 78 (aprox.), Medellín' },
    { nombre: 'Berlín', lat: 6.28287, lon: -75.55285, dir: 'Carrera 45 con Calle 83 (aprox.), Medellín' },
    { nombre: 'Parque Aranjuez', lat: 6.28519, lon: -75.55663, dir: 'Carrera 49A # 93-00, Medellín' }
];

// Definición de cada línea: color, tipo, estilo de trazo y categoría de leyenda
const LINEAS = {
    a:       { estaciones: ESTACIONES_A,       color: '#2563eb', dash: null,     categoria: 'metro-a' },
    b:       { estaciones: ESTACIONES_B,       color: '#f5a623', dash: null,     categoria: 'metro-b' },
    k:       { estaciones: ESTACIONES_K,       color: '#0d9488', dash: '2 8',    categoria: 'metrocable' },
    l:       { estaciones: ESTACIONES_L,       color: '#0d9488', dash: '2 8',    categoria: 'metrocable' },
    h:       { estaciones: ESTACIONES_H,       color: '#0d9488', dash: '2 8',    categoria: 'metrocable' },
    j:       { estaciones: ESTACIONES_J,       color: '#0d9488', dash: '2 8',    categoria: 'metrocable' },
    mp1:     { estaciones: ESTACIONES_MP1,     color: '#e11d48', dash: '6 4',    categoria: 'metroplus' },
    mp2:     { estaciones: ESTACIONES_MP2,     color: '#e11d48', dash: '6 4',    categoria: 'metroplus' },
    tranvia: { estaciones: ESTACIONES_TRANVIA, color: '#7c3aed', dash: '2 8',    categoria: 'tranvia' }
};

// Categorías visibles en la leyenda del mapa (agrupan varias líneas si aplica)
const CATEGORIAS_LEYENDA = [
    { id: 'metro-a',    etiqueta: 'Línea A',    color: '#2563eb' },
    { id: 'metro-b',    etiqueta: 'Línea B',    color: '#f5a623' },
    { id: 'metrocable', etiqueta: 'Metrocable', color: '#0d9488' },
    { id: 'metroplus',  etiqueta: 'Metroplús',  color: '#e11d48' },
    { id: 'tranvia',    etiqueta: 'Tranvía',    color: '#7c3aed' }
];

// Etiquetas y orden de presentación de cada línea en el buscador de estaciones
const ETIQUETAS_LINEA = {
    a:       'Línea A · Metro',
    b:       'Línea B · Metro',
    tranvia: 'Tranvía de Ayacucho',
    k:       'Metrocable K',
    j:       'Metrocable J',
    h:       'Metrocable H',
    l:       'Metrocable L',
    mp1:     'Metroplús · Línea 1',
    mp2:     'Metroplús · Línea 2'
};
const ORDEN_LINEAS = ['a', 'b', 'tranvia', 'k', 'j', 'h', 'l', 'mp1', 'mp2'];

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
    document.getElementById('btnNavigate').addEventListener('click', calcularRuta);
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
Object.entries(LINEAS).forEach(([clave, linea]) => {
    const est = linea.estaciones;
    for (let i = 0; i < est.length - 1; i++) {
        agregarArista(est[i].nombre, est[i + 1].nombre, clave);
        agregarArista(est[i + 1].nombre, est[i].nombre, clave);
    }
});

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

async function calcularRuta() {
    const campoOrigen = document.getElementById('origen');
    const campoDestino = document.getElementById('destino');
    const origenTexto = campoOrigen.value.trim();
    const destinoTexto = campoDestino.value.trim();
    const btnNavigate = document.getElementById('btnNavigate');

    if (!origenTexto || !destinoTexto) {
        mostrarToast('Ingresa una estación de origen y una de destino');
        return;
    }

    btnNavigate.disabled = true;

    const estacionOrigen = buscarEstacion(origenTexto);
    const estacionDestino = buscarEstacion(destinoTexto);

    if (!estacionOrigen) {
        mostrarToast(`"${origenTexto}" no es una estación del sistema`);
        btnNavigate.disabled = false;
        return;
    }
    if (!estacionDestino) {
        mostrarToast(`"${destinoTexto}" no es una estación del sistema`);
        btnNavigate.disabled = false;
        return;
    }

    const resultado = encontrarRutaOptima(estacionOrigen.nombre, estacionDestino.nombre);
    if (!resultado || resultado.camino.length < 2) {
        mostrarToast('No hay una ruta directa entre esas estaciones');
        btnNavigate.disabled = false;
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

    const limites = L.latLngBounds(tramo.map(e => [e.lat, e.lon]));
    mapa.fitBounds(limites, { padding: [90, 90] });

    const sufijoTransbordo = transbordos > 0 ? ` (${transbordos} transbordo${transbordos > 1 ? 's' : ''})` : '';
    mostrarToast(`Ruta lista: ${estacionOrigen.nombre} ➔ ${estacionDestino.nombre}${sufijoTransbordo}`);
    btnNavigate.disabled = false;
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
