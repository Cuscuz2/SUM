// admin.js — Panel de Administración SUM
// Cada sección está conectada a endpoints reales en ../PHP/.

const API_BASE = '../PHP/';
let usuariosCache = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (window.lucide) lucide.createIcons();

    const sesionOk = await verificarSesionAdmin();
    if (!sesionOk) return; // ya se redirigió a mapa.html

    configurarNavegacionAdmin();
    configurarAcciones();

    cargarTarifasAdmin();
    cargarUsuariosAdmin();
    cargarReportes();
    cargarAvisos();
});

/* ---------- Protege esta página: solo accesible tras validar la contraseña ---------- */
async function verificarSesionAdmin() {
    try {
        const res = await fetch(API_BASE + 'sesion_admin.php', {
            method: 'GET',
            credentials: 'same-origin'
        });
        const data = await res.json();
        if (!data.exito) {
            window.location.href = '../MAPA/mapa.html';
            return false;
        }
        return true;
    } catch (err) {
        console.warn('No se pudo verificar la sesión de administrador:', err);
        window.location.href = '../MAPA/mapa.html';
        return false;
    }
}

/* ---------- Navegación entre secciones del panel ---------- */
function configurarNavegacionAdmin() {
    const navItems = document.querySelectorAll('.dash-nav-item[data-target]');
    const views = document.querySelectorAll('.dash-view');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            if (!targetId) return;

            views.forEach(v => v.classList.remove('active'));
            navItems.forEach(i => i.classList.remove('active'));

            const targetView = document.getElementById(targetId);
            if (targetView) targetView.classList.add('active');
            item.classList.add('active');

            if (window.lucide) lucide.createIcons();
            if (targetId === 'view-estaciones') abrirVistaEstaciones();
        });
    });

    const btnCerrar = document.getElementById('btnCerrarSesionAdmin');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch(API_BASE + 'cerrar_sesion_admin.php', {
                    method: 'POST',
                    credentials: 'same-origin'
                });
            } catch (err) {
                console.warn('No se pudo cerrar la sesión de administrador:', err);
            }
            window.location.href = '../MAPA/mapa.html';
        });
    }
}

/* =========================================================
   TARIFAS Y PRECIOS
   ========================================================= */

async function cargarTarifasAdmin() {
    try {
        const res = await fetch(API_BASE + 'tarifas.php', { credentials: 'same-origin' });
        const data = await res.json();
        if (!data.exito) return;

        data.tarifas.forEach(t => {
            const input = document.querySelector(`input[data-clave="${t.clave}"]`);
            if (input) input.value = t.valor;
        });
    } catch (err) {
        console.warn('Error al cargar tarifas:', err);
    }
}

async function guardarTarifas() {
    const inputs = document.querySelectorAll('input[data-clave]');
    const tarifas = {};
    inputs.forEach(input => { tarifas[input.dataset.clave] = Number(input.value); });

    try {
        const res = await fetch(API_BASE + 'actualizar_tarifas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ tarifas })
        });
        const data = await res.json();
        mostrarToastAdmin(data.exito ? 'Tarifas actualizadas correctamente.' : (data.mensaje || 'No se pudieron guardar las tarifas.'));
    } catch (err) {
        mostrarToastAdmin('Error de red al guardar las tarifas.');
        console.warn(err);
    }
}

/* =========================================================
   USUARIOS REGISTRADOS
   ========================================================= */

async function cargarUsuariosAdmin() {
    const tbody = document.getElementById('tablaUsuarios');
    if (!tbody) return;

    try {
        const res = await fetch(API_BASE + 'usuarios_admin.php', { credentials: 'same-origin' });
        const data = await res.json();

        if (!data.exito) {
            tbody.innerHTML = `<tr><td colspan="6" class="admin-placeholder-text">${data.mensaje || 'No se pudo cargar la lista.'}</td></tr>`;
            return;
        }

        usuariosCache = data.usuarios; // se guarda para poder filtrar sin volver a pedir al servidor
        renderizarTablaUsuarios(usuariosCache);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="admin-placeholder-text">Error de red al cargar usuarios.</td></tr>`;
        console.warn(err);
    }
}

function renderizarTablaUsuarios(usuarios) {
    const tbody = document.getElementById('tablaUsuarios');
    if (!tbody) return;

    if (!usuarios.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="admin-placeholder-text">No se encontraron usuarios.</td></tr>`;
        return;
    }

    tbody.innerHTML = usuarios.map(u => {
        const activo = Number(u.activo) === 1;
        const fecha = new Date(u.creado_en.replace(' ', 'T')).toLocaleDateString('es-CO');
        return `
            <tr data-usuario-id="${u.id}">
                <td>${escaparHtml(u.nombre)}</td>
                <td>@${escaparHtml(u.usuario)}</td>
                <td>${escaparHtml(u.email)}</td>
                <td>${fecha}</td>
                <td>
                    <span class="admin-status ${activo ? 'admin-status--ok' : 'admin-status--off'}">
                        ${activo ? 'Activo' : 'Suspendido'}
                    </span>
                </td>
                <td class="admin-row-actions">
                    <button class="admin-icon-btn ${activo ? 'admin-icon-btn--danger' : ''}"
                            title="${activo ? 'Suspender' : 'Activar'}"
                            data-accion="toggle-usuario"
                            data-activo-actual="${activo ? 1 : 0}">
                        <i data-lucide="${activo ? 'ban' : 'check'}"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

function filtrarUsuarios(texto) {
    const q = texto.trim().toLowerCase();
    if (!q) {
        renderizarTablaUsuarios(usuariosCache);
        return;
    }
    const filtrados = usuariosCache.filter(u =>
        u.nombre.toLowerCase().includes(q) ||
        u.usuario.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
    renderizarTablaUsuarios(filtrados);
}

async function alternarEstadoUsuario(usuarioId, activoActual) {
    const nuevoEstado = activoActual === 1 ? 0 : 1;
    try {
        const res = await fetch(API_BASE + 'suspender_usuario.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ usuario_id: usuarioId, activo: nuevoEstado })
        });
        const data = await res.json();
        if (data.exito) {
            mostrarToastAdmin(nuevoEstado === 1 ? 'Cuenta activada.' : 'Cuenta suspendida.');
            cargarUsuariosAdmin();
        } else {
            mostrarToastAdmin(data.mensaje || 'No se pudo cambiar el estado.');
        }
    } catch (err) {
        mostrarToastAdmin('Error de red al cambiar el estado.');
        console.warn(err);
    }
}

/* =========================================================
   REPORTES Y ESTADÍSTICAS
   ========================================================= */

async function cargarReportes() {
    try {
        const res = await fetch(API_BASE + 'reportes.php', { credentials: 'same-origin' });
        const data = await res.json();
        if (!data.exito) return;

        const elUsuarios = document.getElementById('statUsuariosTotal');
        const elViajes = document.getElementById('statViajesTotal');
        const elIngresos = document.getElementById('statIngresoTotal');
        if (elUsuarios) elUsuarios.textContent = data.usuarios_total;
        if (elViajes) elViajes.textContent = data.viajes_mes;
        if (elIngresos) elIngresos.textContent = '$' + data.ingresos_mes.toLocaleString('es-CO').replace(/,/g, '.');

        const lista = document.getElementById('rutasFrecuentesLista');
        if (lista) {
            if (!data.rutas_frecuentes.length) {
                lista.textContent = 'Todavía no hay viajes registrados.';
            } else {
                lista.innerHTML = data.rutas_frecuentes
                    .map(r => `${escaparHtml(r.estacion_origen)} → ${escaparHtml(r.estacion_destino)} <strong>(${r.veces} viajes)</strong>`)
                    .join('<br>');
            }
        }
    } catch (err) {
        console.warn('Error al cargar reportes:', err);
    }
}

/* =========================================================
   AVISOS Y NOTIFICACIONES
   ========================================================= */

async function cargarAvisos() {
    const lista = document.getElementById('avisosLista');
    if (!lista) return;

    try {
        const res = await fetch(API_BASE + 'avisos.php', { credentials: 'same-origin' });
        const data = await res.json();
        if (!data.exito || !data.avisos.length) {
            lista.textContent = 'Todavía no se ha enviado ningún aviso.';
            return;
        }
        lista.innerHTML = data.avisos
            .map(a => `<strong>${escaparHtml(a.titulo)}</strong> — ${escaparHtml(a.mensaje)}`)
            .join('<br><br>');
    } catch (err) {
        lista.textContent = 'Error de red al cargar los avisos.';
        console.warn(err);
    }
}

async function enviarAviso(titulo, mensaje, destino) {
    try {
        const res = await fetch(API_BASE + 'avisos.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ titulo, mensaje, destino })
        });
        const data = await res.json();
        if (data.exito) {
            mostrarToastAdmin('Aviso enviado.');
            cargarAvisos();
        } else {
            mostrarToastAdmin(data.mensaje || 'No se pudo enviar el aviso.');
        }
    } catch (err) {
        mostrarToastAdmin('Error de red al enviar el aviso.');
        console.warn(err);
    }
}

/* ---------- Acciones de los botones ---------- */
function configurarAcciones() {
    const btnGuardarTarifas = document.getElementById('btnGuardarTarifas');
    if (btnGuardarTarifas) {
        btnGuardarTarifas.addEventListener('click', guardarTarifas);
    }

    const btnEnviarAviso = document.getElementById('btnEnviarAviso');
    if (btnEnviarAviso) {
        btnEnviarAviso.addEventListener('click', () => {
            const titulo = document.getElementById('avisoTitulo').value.trim();
            const mensaje = document.getElementById('avisoMensaje').value.trim();
            const destino = document.getElementById('avisoDestino').value;
            if (!titulo || !mensaje) {
                mostrarToastAdmin('Escribe un título y un mensaje.');
                return;
            }
            enviarAviso(titulo, mensaje, destino);
            document.getElementById('avisoTitulo').value = '';
            document.getElementById('avisoMensaje').value = '';
        });
    }

    // Editor de "Estaciones y líneas"
    configurarEditorRed();

    // Delegación de eventos para los botones "Suspender/Activar" de la tabla de usuarios
    const tablaUsuarios = document.getElementById('tablaUsuarios');
    if (tablaUsuarios) {
        tablaUsuarios.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-accion="toggle-usuario"]');
            if (!btn) return;
            const fila = btn.closest('tr[data-usuario-id]');
            if (!fila) return;
            const usuarioId = Number(fila.dataset.usuarioId);
            const activoActual = Number(btn.dataset.activoActual);

            if (activoActual === 1) {
                const u = usuariosCache.find(x => Number(x.id) === usuarioId);
                const quien = u ? `${u.nombre} (@${u.usuario})` : 'este usuario';
                if (!confirm(`¿Suspender la cuenta de ${quien}?\n\nNo podrá iniciar sesión ni usar el sistema hasta que la actives de nuevo.`)) return;
            }
            alternarEstadoUsuario(usuarioId, activoActual);
        });
    }

    // Buscador de "Usuarios registrados"
    const buscarUsuarios = document.getElementById('buscarUsuarios');
    if (buscarUsuarios) {
        buscarUsuarios.addEventListener('input', (e) => filtrarUsuarios(e.target.value));
    }
}

function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function mostrarToastAdmin(mensaje) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = mensaje;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
}


/* =========================================================
   ESTACIONES Y LÍNEAS
   El administrador edita la red que ven los usuarios en el mapa.
   Datos: ../PHP/admin_red.php (GET lista, POST guarda/elimina).
   ========================================================= */

const CENTRO_MAPA_ADMIN = [6.2472, -75.5697]; // San Antonio
const TRAZO_POR_TIPO = { metro: null, metrocable: '2 8', metroplus: '6 4', tranvia: '2 8' };
const NOMBRE_POR_TIPO = { metro: 'Metro', metrocable: 'Metrocable', metroplus: 'Metroplús', tranvia: 'Tranvía' };

const red = {
    lineas: [],      // [{ clave, nombre, tipo, color, estaciones: [ids en orden], protegida }]
    estaciones: [],  // [{ id, nombre, lat, lon, dir }]
    mapa: null,
    capa: null
};

// Lo que se está editando ahora mismo (o null si se ve solo la lista):
//  { clase: 'linea',    clave, nombre, tipoTransporte, color, estaciones: [ids], insertarDespues, protegida }
//  { clase: 'estacion', id, nombre, dir, lat, lon }
let redEditor = null;

const redEl = (id) => document.getElementById(id);

/* ---------- Entrada a la sección ---------- */
function abrirVistaEstaciones() {
    iniciarMapaAdmin();
    setTimeout(() => { if (red.mapa) red.mapa.invalidateSize(); }, 150);
    if (!redEditor) cargarRedAdmin(); // no se pisa lo que se está editando
}

function iniciarMapaAdmin() {
    if (red.mapa) return;
    const contenedor = redEl('adminMapa');
    if (!contenedor) return;
    if (!window.L) {
        redEl('redMapaHint').textContent = 'No se pudo cargar el mapa. Revisa tu conexión a internet.';
        return;
    }

    red.mapa = L.map('adminMapa', { zoomControl: true }).setView(CENTRO_MAPA_ADMIN, 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(red.mapa);

    // Al crear o editar una estación, un clic en el mapa fija su ubicación
    red.mapa.on('click', (e) => {
        if (redEditor && redEditor.clase === 'estacion') {
            ubicarEstacionEditada(e.latlng.lat, e.latlng.lng, true);
        }
    });

    actualizarHintMapa();
}

async function cargarRedAdmin() {
    try {
        const res = await fetch(API_BASE + 'admin_red.php', { credentials: 'same-origin' });
        const data = await res.json();
        if (!data.exito) {
            mostrarToastAdmin(data.mensaje || 'No se pudo cargar la red.');
            redEl('redListaLineas').innerHTML = `<p class="red-vacio">${escaparHtml(data.mensaje || 'No se pudo cargar la red.')}</p>`;
            return false;
        }
        red.lineas = data.lineas;
        red.estaciones = data.estaciones;
        renderizarListaLineas();
        renderizarListaEstaciones();
        redibujarMapa();
        return true;
    } catch (err) {
        console.warn('Error al cargar la red:', err);
        mostrarToastAdmin('Error de red al cargar estaciones y líneas.');
        return false;
    }
}

// Todas las acciones de guardado/eliminado pasan por aquí
async function llamarAdminRed(cuerpo) {
    try {
        const res = await fetch(API_BASE + 'admin_red.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(cuerpo)
        });
        return await res.json();
    } catch (err) {
        console.warn(err);
        return { exito: false, mensaje: 'Error de red. Intenta de nuevo.' };
    }
}

/* ---------- Pestañas y vistas ---------- */
function mostrarPestana(tab) {
    document.querySelectorAll('.red-tab').forEach(b => {
        const activa = b.dataset.redTab === tab;
        b.classList.toggle('active', activa);
        b.setAttribute('aria-selected', String(activa));
    });
    redEl('redTabLineas').classList.toggle('active', tab === 'lineas');
    redEl('redTabEstaciones').classList.toggle('active', tab === 'estaciones');
}

// Vuelve a mostrar las listas (y oculta los formularios) en ambas pestañas
function mostrarListasRed() {
    ['redVistaListaLineas', 'redVistaListaEstaciones'].forEach(id => redEl(id).classList.add('active'));
    ['redVistaEditorLinea', 'redVistaEditorEstacion'].forEach(id => redEl(id).classList.remove('active'));
}

function mostrarVistaEditor(clase) {
    const esLinea = clase === 'linea';
    mostrarPestana(esLinea ? 'lineas' : 'estaciones');
    redEl('redVistaListaLineas').classList.toggle('active', !esLinea);
    redEl('redVistaEditorLinea').classList.toggle('active', esLinea);
    redEl('redVistaListaEstaciones').classList.toggle('active', esLinea);
    redEl('redVistaEditorEstacion').classList.toggle('active', !esLinea);
}

function cambiarPestanaRed(tab) {
    redEditor = null;
    mostrarPestana(tab);
    mostrarListasRed();
    actualizarHintMapa();
    redibujarMapa();
}

function cerrarEditorRed() {
    redEditor = null;
    mostrarListasRed();
    renderizarListaLineas();
    renderizarListaEstaciones();
    actualizarHintMapa();
    redibujarMapa();
}

function actualizarHintMapa() {
    const hint = redEl('redMapaHint');
    if (!hint) return;
    if (redEditor && redEditor.clase === 'linea') {
        hint.textContent = 'Editando el recorrido. Las demás líneas se ven atenuadas.';
    } else if (redEditor && redEditor.clase === 'estacion') {
        hint.textContent = 'Haz clic en el mapa o arrastra el punto verde para fijar la ubicación.';
    } else if (redEl('redTabEstaciones').classList.contains('active')) {
        hint.textContent = 'Haz clic en una estación del mapa o de la lista para editarla.';
    } else {
        hint.textContent = 'Elige una línea de la lista para editar su recorrido.';
    }
}

/* ---------- Listas ---------- */
function estacionesPorId() {
    return new Map(red.estaciones.map(e => [e.id, e]));
}

function lineasDeEstacion(id) {
    return red.lineas.filter(l => l.estaciones.includes(id));
}

function renderizarListaLineas() {
    const cont = redEl('redListaLineas');
    if (!cont) return;
    if (!red.lineas.length) {
        cont.innerHTML = '<p class="red-vacio">Todavía no hay líneas. Crea la primera con el botón de abajo.</p>';
        return;
    }
    cont.innerHTML = red.lineas.map(l => `
        <button type="button" class="red-item" data-clave="${escaparHtml(l.clave)}">
            <span class="red-item-dot" style="background:${escaparHtml(l.color)};"></span>
            <span class="red-item-main">
                <span class="red-item-nombre">${escaparHtml(l.nombre)}</span>
                <span class="red-item-sub">${NOMBRE_POR_TIPO[l.tipo] || l.tipo} · ${l.estaciones.length} ${l.estaciones.length === 1 ? 'estación' : 'estaciones'}</span>
            </span>
            <i data-lucide="chevron-right"></i>
        </button>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

function renderizarListaEstaciones() {
    const cont = redEl('redListaEstaciones');
    if (!cont) return;
    const q = (redEl('redBuscarEstacion').value || '').trim().toLowerCase();
    const lista = red.estaciones.filter(e => !q || e.nombre.toLowerCase().includes(q));

    if (!lista.length) {
        cont.innerHTML = `<p class="red-vacio">${q ? 'No hay estaciones con ese nombre.' : 'Todavía no hay estaciones.'}</p>`;
        return;
    }
    cont.innerHTML = lista.map(e => {
        const ls = lineasDeEstacion(e.id);
        const sub = ls.length
            ? ls.map(l => escaparHtml(l.nombre.split(' · ')[0])).join(', ') + (ls.length > 1 ? ' · transbordo' : '')
            : 'Sin línea asignada';
        const color = ls.length === 0 ? '#94a3b8' : ls.length > 1 ? '#0f172a' : ls[0].color;
        return `
            <button type="button" class="red-item" data-id="${e.id}">
                <span class="red-item-dot" style="background:${escaparHtml(color)};"></span>
                <span class="red-item-main">
                    <span class="red-item-nombre">${escaparHtml(e.nombre)}</span>
                    <span class="red-item-sub">${sub}</span>
                </span>
                <i data-lucide="chevron-right"></i>
            </button>`;
    }).join('');
    if (window.lucide) lucide.createIcons();
}

/* ---------- Editor de línea ---------- */
function abrirEditorLinea(clave) {
    const l = clave ? red.lineas.find(x => x.clave === clave) : null;
    if (clave && !l) return;

    redEditor = {
        clase: 'linea',
        clave: l ? l.clave : null,
        nombre: l ? l.nombre : '',
        tipoTransporte: l ? l.tipo : 'metro',
        color: l ? l.color : '#2563eb',
        estaciones: l ? [...l.estaciones] : [],
        insertarDespues: null, // null = agregar al final
        protegida: !!(l && l.protegida)
    };

    redEl('redTituloLinea').textContent = l ? 'Editar línea' : 'Nueva línea';
    redEl('lineaNombre').value = redEditor.nombre;
    redEl('lineaTipo').value = redEditor.tipoTransporte;
    redEl('lineaColor').value = redEditor.color;
    redEl('btnEliminarLinea').hidden = !l || redEditor.protegida;
    redEl('redNotaProtegida').hidden = !redEditor.protegida;

    mostrarVistaEditor('linea');
    renderizarRecorrido();
    actualizarHintMapa();
    redibujarMapa();
    ajustarMapaAEstaciones(redEditor.estaciones);
    if (window.lucide) lucide.createIcons();
}

function renderizarRecorrido() {
    const ed = redEditor;
    if (!ed || ed.clase !== 'linea') return;
    const porId = estacionesPorId();
    const ol = redEl('redRecorrido');

    redEl('redContadorRecorrido').textContent =
        `${ed.estaciones.length} ${ed.estaciones.length === 1 ? 'estación' : 'estaciones'}`;

    if (!ed.estaciones.length) {
        ol.innerHTML = '<li class="red-vacio">Aún no hay estaciones. Agrégalas con la lista de abajo.</li>';
    } else {
        const ultima = ed.estaciones.length - 1;
        ol.innerHTML = ed.estaciones.map((id, i) => {
            const e = porId.get(id);
            const marcada = ed.insertarDespues === i;
            return `
                <li class="red-paso${marcada ? ' red-paso--marca' : ''}" data-i="${i}">
                    <span class="red-paso-num" style="background:${escaparHtml(ed.color)};">${i + 1}</span>
                    <span class="red-paso-nombre">${escaparHtml(e ? e.nombre : '(estación eliminada)')}</span>
                    <span class="red-paso-acciones">
                        <button type="button" data-accion="despues" class="${marcada ? 'activo' : ''}" title="Agregar una estación justo después de esta" aria-label="Agregar una estación después de ${escaparHtml(e ? e.nombre : '')}"><i data-lucide="plus"></i></button>
                        <button type="button" data-accion="subir" title="Mover arriba" aria-label="Mover arriba" ${i === 0 ? 'disabled' : ''}><i data-lucide="arrow-up"></i></button>
                        <button type="button" data-accion="bajar" title="Mover abajo" aria-label="Mover abajo" ${i === ultima ? 'disabled' : ''}><i data-lucide="arrow-down"></i></button>
                        <button type="button" data-accion="quitar" title="Quitar del recorrido" aria-label="Quitar del recorrido"><i data-lucide="x"></i></button>
                    </span>
                </li>`;
        }).join('');
    }

    // Selector: solo las estaciones que todavía no están en este recorrido
    const enRecorrido = new Set(ed.estaciones);
    const disponibles = red.estaciones.filter(e => !enRecorrido.has(e.id));
    const select = redEl('lineaAgregar');
    select.innerHTML = '<option value="">Elegir estación…</option>'
        + disponibles.map(e => `<option value="${e.id}">${escaparHtml(e.nombre)}</option>`).join('');

    const etiqueta = redEl('lineaAgregarEtiqueta');
    if (ed.insertarDespues === null) {
        etiqueta.textContent = 'Agregar estación al final';
    } else {
        const previa = porId.get(ed.estaciones[ed.insertarDespues]);
        etiqueta.textContent = `Agregar estación después de «${previa ? previa.nombre : '…'}»`;
    }

    if (window.lucide) lucide.createIcons();
}

function manejarAccionRecorrido(e) {
    const boton = e.target.closest('button[data-accion]');
    const fila = e.target.closest('li[data-i]');
    if (!boton || !fila || !redEditor || redEditor.clase !== 'linea') return;

    const ed = redEditor;
    const i = Number(fila.dataset.i);

    switch (boton.dataset.accion) {
        case 'despues': // alterna el punto donde se insertará la próxima estación
            ed.insertarDespues = ed.insertarDespues === i ? null : i;
            break;
        case 'subir':
            if (i > 0) [ed.estaciones[i - 1], ed.estaciones[i]] = [ed.estaciones[i], ed.estaciones[i - 1]];
            ed.insertarDespues = null;
            break;
        case 'bajar':
            if (i < ed.estaciones.length - 1) [ed.estaciones[i + 1], ed.estaciones[i]] = [ed.estaciones[i], ed.estaciones[i + 1]];
            ed.insertarDespues = null;
            break;
        case 'quitar':
            ed.estaciones.splice(i, 1);
            ed.insertarDespues = null;
            break;
    }
    renderizarRecorrido();
    redibujarMapa();
}

function agregarEstacionAlRecorrido(id) {
    const ed = redEditor;
    if (!ed || ed.clase !== 'linea' || ed.estaciones.includes(id)) return;

    const posicion = ed.insertarDespues === null ? ed.estaciones.length : ed.insertarDespues + 1;
    ed.estaciones.splice(posicion, 0, id);
    // Si se estaba insertando "después de X", la siguiente va justo después de la que acaba de entrar
    if (ed.insertarDespues !== null) ed.insertarDespues = posicion;

    renderizarRecorrido();
    redibujarMapa();
}

async function guardarLineaRed() {
    const ed = redEditor;
    if (!ed || ed.clase !== 'linea') return;

    const nombre = ed.nombre.trim();
    if (!nombre) { mostrarToastAdmin('Escribe el nombre de la línea.'); return; }
    if (ed.estaciones.length < 2) { mostrarToastAdmin('El recorrido necesita al menos 2 estaciones.'); return; }

    const btn = redEl('btnGuardarLinea');
    btn.disabled = true;
    const data = await llamarAdminRed({
        accion: 'guardar_linea',
        clave: ed.clave,
        nombre,
        tipo: ed.tipoTransporte,
        color: ed.color,
        estaciones: ed.estaciones
    });
    btn.disabled = false;

    if (!data.exito) { mostrarToastAdmin(data.mensaje || 'No se pudo guardar la línea.'); return; }

    mostrarToastAdmin('Línea guardada. Los usuarios ya ven el cambio.');
    redEditor = null;
    await cargarRedAdmin();
    mostrarListasRed();
    actualizarHintMapa();
}

async function eliminarLineaRed() {
    const ed = redEditor;
    if (!ed || ed.clase !== 'linea' || !ed.clave) return;
    if (!confirm(`¿Eliminar la línea «${ed.nombre}»?\n\nLas estaciones no se borran; solo deja de existir esta línea.`)) return;

    const data = await llamarAdminRed({ accion: 'eliminar_linea', clave: ed.clave });
    if (!data.exito) { mostrarToastAdmin(data.mensaje || 'No se pudo eliminar la línea.'); return; }

    mostrarToastAdmin('Línea eliminada.');
    redEditor = null;
    await cargarRedAdmin();
    mostrarListasRed();
    actualizarHintMapa();
}

/* ---------- Editor de estación ---------- */
function abrirEditorEstacion(id) {
    const e = id ? red.estaciones.find(x => x.id === id) : null;
    if (id && !e) return;

    let lat = e ? e.lat : null;
    let lon = e ? e.lon : null;
    if (!e && red.mapa) { // estación nueva: el punto arranca en el centro del mapa para poder arrastrarlo
        const c = red.mapa.getCenter();
        lat = Number(c.lat.toFixed(6));
        lon = Number(c.lng.toFixed(6));
    }

    redEditor = { clase: 'estacion', id: e ? e.id : null, nombre: e ? e.nombre : '', dir: e ? e.dir : '', lat, lon };

    redEl('redTituloEstacion').textContent = e ? 'Editar estación' : 'Nueva estación';
    redEl('estacionNombre').value = redEditor.nombre;
    redEl('estacionDir').value = redEditor.dir;
    redEl('estacionLat').value = lat ?? '';
    redEl('estacionLon').value = lon ?? '';
    redEl('btnEliminarEstacion').hidden = !e;

    const ls = e ? lineasDeEstacion(e.id) : [];
    redEl('redEstacionLineas').textContent = !e
        ? 'Después de crearla, agrégala al recorrido de una línea desde la pestaña Líneas.'
        : ls.length
            ? 'Está en: ' + ls.map(l => l.nombre).join(', ') + '.'
            : 'Todavía no pertenece a ninguna línea. Agrégala desde la pestaña Líneas.';

    mostrarVistaEditor('estacion');
    actualizarHintMapa();
    redibujarMapa();
    if (red.mapa && e) red.mapa.setView([e.lat, e.lon], Math.max(red.mapa.getZoom(), 14));
    if (window.lucide) lucide.createIcons();
}

// Fija lat/lon de la estación en edición (clic en el mapa, arrastre o campos numéricos)
function ubicarEstacionEditada(lat, lon, redibujar) {
    const ed = redEditor;
    if (!ed || ed.clase !== 'estacion') return;
    ed.lat = Number(lat.toFixed(6));
    ed.lon = Number(lon.toFixed(6));
    redEl('estacionLat').value = ed.lat;
    redEl('estacionLon').value = ed.lon;
    if (redibujar) redibujarMapa();
}

async function guardarEstacionRed() {
    const ed = redEditor;
    if (!ed || ed.clase !== 'estacion') return;

    const nombre = ed.nombre.trim();
    if (!nombre) { mostrarToastAdmin('Escribe el nombre de la estación.'); return; }
    if (ed.lat === null || ed.lon === null || Number.isNaN(ed.lat) || Number.isNaN(ed.lon)) {
        mostrarToastAdmin('Marca la ubicación de la estación en el mapa.');
        return;
    }

    const btn = redEl('btnGuardarEstacion');
    btn.disabled = true;
    const data = await llamarAdminRed({
        accion: 'guardar_estacion',
        id: ed.id,
        nombre,
        dir: ed.dir.trim(),
        lat: ed.lat,
        lon: ed.lon
    });
    btn.disabled = false;

    if (!data.exito) { mostrarToastAdmin(data.mensaje || 'No se pudo guardar la estación.'); return; }

    mostrarToastAdmin('Estación guardada. Los usuarios ya ven el cambio.');
    redEditor = null;
    await cargarRedAdmin();
    mostrarListasRed();
    actualizarHintMapa();
}

async function eliminarEstacionRed() {
    const ed = redEditor;
    if (!ed || ed.clase !== 'estacion' || !ed.id) return;

    const ls = lineasDeEstacion(ed.id);
    const aviso = ls.length
        ? `\n\nSe quitará también del recorrido de: ${ls.map(l => l.nombre).join(', ')}.`
        : '';
    if (!confirm(`¿Eliminar la estación «${ed.nombre}»?${aviso}`)) return;

    const data = await llamarAdminRed({ accion: 'eliminar_estacion', id: ed.id });
    if (!data.exito) { mostrarToastAdmin(data.mensaje || 'No se pudo eliminar la estación.'); return; }

    mostrarToastAdmin('Estación eliminada.');
    redEditor = null;
    await cargarRedAdmin();
    mostrarListasRed();
    actualizarHintMapa();
}

/* ---------- Mapa ---------- */
function ajustarMapaAEstaciones(ids) {
    if (!red.mapa) return;
    const porId = estacionesPorId();
    const puntos = ids.map(id => porId.get(id)).filter(Boolean).map(e => [e.lat, e.lon]);
    if (puntos.length >= 2) red.mapa.fitBounds(L.latLngBounds(puntos), { padding: [50, 50] });
    else if (puntos.length === 1) red.mapa.setView(puntos[0], 15);
}

function redibujarMapa() {
    if (!red.mapa) return;
    if (red.capa) red.capa.remove();

    const capa = L.layerGroup();
    const ed = redEditor;
    const editandoLinea = !!ed && ed.clase === 'linea';
    const editandoEstacion = !!ed && ed.clase === 'estacion';
    const porId = estacionesPorId();

    // Líneas guardadas (la que se está editando se dibuja aparte, con sus cambios)
    red.lineas.forEach(l => {
        if (editandoLinea && ed.clave === l.clave) return;
        const puntos = l.estaciones.map(id => porId.get(id)).filter(Boolean).map(e => [e.lat, e.lon]);
        if (puntos.length < 2) return;
        L.polyline(puntos, {
            color: l.color,
            weight: 4,
            opacity: editandoLinea ? 0.25 : 0.85,
            dashArray: TRAZO_POR_TIPO[l.tipo] || null
        }).addTo(capa);
    });

    // Borrador de la línea en edición: trazo grueso y estaciones numeradas
    if (editandoLinea) {
        const est = ed.estaciones.map(id => porId.get(id)).filter(Boolean);
        if (est.length >= 2) {
            L.polyline(est.map(e => [e.lat, e.lon]), {
                color: ed.color,
                weight: 6,
                opacity: 0.95,
                dashArray: TRAZO_POR_TIPO[ed.tipoTransporte] || null
            }).addTo(capa);
        }
        est.forEach((e, i) => {
            L.circleMarker([e.lat, e.lon], {
                radius: 7, weight: 3, color: '#ffffff', fillColor: ed.color, fillOpacity: 1,
                bubblingMouseEvents: false
            }).bindTooltip(`${i + 1}. ${escaparHtml(e.nombre)}`, { direction: 'top', offset: [0, -6] }).addTo(capa);
        });
    }

    // Demás estaciones
    red.estaciones.forEach(e => {
        if (editandoEstacion && ed.id === e.id) return;          // en su lugar va el punto verde
        if (editandoLinea && ed.estaciones.includes(e.id)) return; // ya se dibujó numerada

        const ls = lineasDeEstacion(e.id);
        const color = ls.length === 0 ? '#94a3b8' : ls.length > 1 ? '#0f172a' : ls[0].color;
        const marcador = L.circleMarker([e.lat, e.lon], {
            radius: ls.length > 1 ? 7 : 5,
            weight: 2,
            color: '#ffffff',
            fillColor: color,
            fillOpacity: editandoLinea ? 0.45 : 1,
            bubblingMouseEvents: false // un clic en la estación no debe contar como clic en el mapa
        }).bindTooltip(
            escaparHtml(e.nombre) + (ls.length > 1 ? ' (transbordo)' : ls.length === 0 ? ' (sin línea)' : ''),
            { direction: 'top', offset: [0, -6] }
        );
        if (!editandoLinea) marcador.on('click', () => abrirEditorEstacion(e.id));
        marcador.addTo(capa);
    });

    // Punto verde de la estación en edición (se puede arrastrar)
    if (editandoEstacion && ed.lat !== null && ed.lon !== null) {
        const pin = L.marker([ed.lat, ed.lon], {
            draggable: true,
            icon: L.divIcon({ className: '', html: '<span class="red-pin"></span>', iconSize: [22, 22], iconAnchor: [11, 11] })
        });
        // No se redibuja al soltar: recrear el punto en pleno arrastre lo interrumpe.
        pin.on('dragend', () => {
            const p = pin.getLatLng();
            ubicarEstacionEditada(p.lat, p.lng, false);
        });
        pin.addTo(capa);
    }

    capa.addTo(red.mapa);
    red.capa = capa;
}

/* ---------- Conexión de los controles (una sola vez al cargar) ---------- */
function configurarEditorRed() {
    if (!redEl('view-estaciones')) return;

    document.querySelectorAll('.red-tab').forEach(b => {
        b.addEventListener('click', () => cambiarPestanaRed(b.dataset.redTab));
    });

    redEl('redListaLineas').addEventListener('click', (e) => {
        const item = e.target.closest('.red-item[data-clave]');
        if (item) abrirEditorLinea(item.dataset.clave);
    });
    redEl('redListaEstaciones').addEventListener('click', (e) => {
        const item = e.target.closest('.red-item[data-id]');
        if (item) abrirEditorEstacion(Number(item.dataset.id));
    });
    redEl('redBuscarEstacion').addEventListener('input', renderizarListaEstaciones);

    redEl('btnNuevaLinea').addEventListener('click', () => abrirEditorLinea(null));
    redEl('btnNuevaEstacion').addEventListener('click', () => abrirEditorEstacion(null));
    redEl('btnVolverLinea').addEventListener('click', cerrarEditorRed);
    redEl('btnVolverEstacion').addEventListener('click', cerrarEditorRed);

    // Línea
    redEl('lineaNombre').addEventListener('input', (e) => {
        if (redEditor && redEditor.clase === 'linea') redEditor.nombre = e.target.value;
    });
    redEl('lineaTipo').addEventListener('change', (e) => {
        if (redEditor && redEditor.clase === 'linea') { redEditor.tipoTransporte = e.target.value; redibujarMapa(); }
    });
    redEl('lineaColor').addEventListener('input', (e) => {
        if (redEditor && redEditor.clase === 'linea') {
            redEditor.color = e.target.value;
            renderizarRecorrido();
            redibujarMapa();
        }
    });
    redEl('redRecorrido').addEventListener('click', manejarAccionRecorrido);
    redEl('lineaAgregar').addEventListener('change', (e) => {
        const id = Number(e.target.value);
        if (id) agregarEstacionAlRecorrido(id);
    });
    redEl('btnGuardarLinea').addEventListener('click', guardarLineaRed);
    redEl('btnEliminarLinea').addEventListener('click', eliminarLineaRed);

    // Estación
    redEl('estacionNombre').addEventListener('input', (e) => {
        if (redEditor && redEditor.clase === 'estacion') redEditor.nombre = e.target.value;
    });
    redEl('estacionDir').addEventListener('input', (e) => {
        if (redEditor && redEditor.clase === 'estacion') redEditor.dir = e.target.value;
    });
    ['estacionLat', 'estacionLon'].forEach(id => {
        redEl(id).addEventListener('change', () => {
            if (!redEditor || redEditor.clase !== 'estacion') return;
            const lat = parseFloat(redEl('estacionLat').value);
            const lon = parseFloat(redEl('estacionLon').value);
            if (Number.isNaN(lat) || Number.isNaN(lon)) return;
            ubicarEstacionEditada(lat, lon, true);
            if (red.mapa) red.mapa.panTo([redEditor.lat, redEditor.lon]);
        });
    });
    redEl('btnGuardarEstacion').addEventListener('click', guardarEstacionRed);
    redEl('btnEliminarEstacion').addEventListener('click', eliminarEstacionRed);
}
