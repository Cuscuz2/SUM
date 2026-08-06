document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    setupScrollReveal();
});

/* ---------- Menú móvil ---------- */
function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    const toggle = document.getElementById('menuToggle');
    menu.classList.toggle('active');
    toggle.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
}

/* ---------- Modales ---------- */
function abrirLogin() {
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
function iniciarSesion(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim(); // ajusta este id si tu input de correo se llama distinto
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Valida correo y contraseña juntos
    if (!emailRegex.test(email) || password.length < 6) {
        errorEl.classList.add('active');
        return; // se detiene aquí, NO redirige
    }

    errorEl.classList.remove('active');
    cerrarLogin();
    window.location.href = "mapa.html"; // solo redirige si todo es válido
}

function registrarUsuario(event) {
    event.preventDefault();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirmPassword').value;
    const errorEl = document.getElementById('registerError');
    if (password !== confirm) {
        errorEl.classList.add('active');
        return;
    }
    errorEl.classList.remove('active');
    cerrarRegistro();
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