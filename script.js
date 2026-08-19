document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    setupScrollReveal();
});

/* ---------- Menú Móvil ---------- */
function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    const toggle = document.getElementById('menuToggle');
    menu.classList.toggle('active');
    toggle.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
}

/* ---------- Modales ---------- */
function abrirRecuperar() {
    cerrarLogin();
    document.getElementById('forgotModal').classList.add('active');
}
function cerrarRecuperar() {
    document.getElementById('forgotModal').classList.remove('active');
    document.getElementById('forgotSuccess').classList.remove('active');
    document.getElementById('forgotForm').reset();
}
function recuperarPassword(event) {
    event.preventDefault();
    const successEl = document.getElementById('forgotSuccess');
    successEl.classList.add('active');
}
function abrirLogin() {
    cerrarRegistro();
    cerrarRecuperar();
    document.getElementById('loginModal').classList.add('active');
}
function cerrarLogin() {
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('loginError').classList.remove('active');
}
function abrirRegistro() {
    cerrarLogin();
    document.getElementById('registerModal').classList.add('active');
}
function cerrarRegistro() {
    document.getElementById('registerModal').classList.remove('active');
    document.getElementById('registerError').classList.remove('active');
}

// Cerrar modal al hacer clic fuera del contenido
document.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

/* ---------- Formularios (demo) ---------- */
async function iniciarSesion(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    try {
        const res = await fetch('../PHP/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!data.exito) {
            errorEl.textContent = data.mensaje;
            errorEl.classList.add('active');
            return;
        }
        errorEl.classList.remove('active');
        cerrarLogin();
        window.location.href = "../MAPA/mapa.html";
    } catch (err) {
        errorEl.textContent = "Error de conexión con el servidor.";
        errorEl.classList.add('active');
    }
}

async function registrarUsuario(event) {
    event.preventDefault();
    const nombre = document.getElementById('regNombre').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const errorEl = document.getElementById('registerError');

    try {
        const res = await fetch('../PHP/registro.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password, confirmPassword })
        });
        const data = await res.json();

        if (!data.exito) {
            errorEl.textContent = data.mensaje;
            errorEl.classList.add('active');
            return;
        }
        errorEl.classList.remove('active');
        cerrarRegistro();
        window.location.href = "../MAPA/mapa.html";
    } catch (err) {
        errorEl.textContent = "Error de conexión con el servidor.";
        errorEl.classList.add('active');
    }
}

/* ---------- Aparición al hacer scroll ---------- */
function setupScrollReveal() {
    const elements = document.querySelectorAll('.fade-in');
    elements.forEach(el => el.classList.add('reveal-pending'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    elements.forEach(el => observer.observe(el));
}