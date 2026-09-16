// admin.js — Panel de Administración SUM
// Navegación entre secciones + acciones de ejemplo.
// Los botones de guardar/enviar están conectados a funciones de ejemplo:
// reemplázalas por llamadas fetch a tus endpoints reales en ../PHP/.

const API_BASE = '../PHP/';

document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();

    verificarSesionAdmin();
    configurarNavegacionAdmin();
    configurarAcciones();
});

/* ---------- Protege esta página: solo accesible tras validar la contraseña ---------- */
// mapa.js marca $_SESSION['es_admin'] = true en verificar_admin.php al validar
// la contraseña. Aquí se confirma esa sesión antes de mostrar el panel;
// si no existe, se regresa al mapa. Crea un endpoint PHP/sesion_admin.php
// que responda { exito: true } solo si $_SESSION['es_admin'] está activo.
async function verificarSesionAdmin() {
    try {
        const res = await fetch(API_BASE + 'sesion_admin.php', {
            method: 'GET',
            credentials: 'same-origin'
        });
        const data = await res.json();
        if (!data.exito) {
            window.location.href = 'mapa.html';
        }
    } catch (err) {
        console.warn('No se pudo verificar la sesión de administrador:', err);
        // Si el endpoint aún no existe, se deja pasar para no bloquear el desarrollo.
        // Elimina este comentario y el try/catch de arriba cuando el endpoint esté listo.
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
            window.location.href = 'mapa.html';
        });
    }
}

/* ---------- Acciones de ejemplo (guardar tarifas / enviar aviso) ---------- */
function configurarAcciones() {
    const btnGuardarTarifas = document.getElementById('btnGuardarTarifas');
    if (btnGuardarTarifas) {
        btnGuardarTarifas.addEventListener('click', () => {
            // TODO: recolectar los valores de los inputs y enviarlos a
            // ../PHP/actualizar_tarifas.php
            mostrarToastAdmin('Cambios de tarifas guardados (ejemplo).');
        });
    }

    const btnEnviarAviso = document.getElementById('btnEnviarAviso');
    if (btnEnviarAviso) {
        btnEnviarAviso.addEventListener('click', () => {
            const titulo = document.getElementById('avisoTitulo').value.trim();
            const mensaje = document.getElementById('avisoMensaje').value.trim();
            if (!titulo || !mensaje) {
                mostrarToastAdmin('Escribe un título y un mensaje.');
                return;
            }
            // TODO: enviar a ../PHP/enviar_aviso.php
            mostrarToastAdmin('Aviso enviado (ejemplo).');
            document.getElementById('avisoTitulo').value = '';
            document.getElementById('avisoMensaje').value = '';
        });
    }

    const btnNuevaEstacion = document.getElementById('btnNuevaEstacion');
    if (btnNuevaEstacion) {
        btnNuevaEstacion.addEventListener('click', () => {
            mostrarToastAdmin('Aquí puedes abrir un formulario para crear una estación.');
        });
    }
}

function mostrarToastAdmin(mensaje) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = mensaje;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
}
