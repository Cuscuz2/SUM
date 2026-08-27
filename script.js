document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    setupScrollReveal();
    setupNavProgress();
    setupActiveStop();
});

/* ---------- Menú Móvil ---------- */
function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    const toggle = document.getElementById('menuToggle');
    menu.classList.toggle('active');
    toggle.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
}

/* ---------- Mostrar/Ocultar contraseña ---------- */
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const mostrando = input.type === 'text';

    input.type = mostrando ? 'password' : 'text';
    btn.innerHTML = `<i data-lucide="${mostrando ? 'eye' : 'eye-off'}"></i>`;
    btn.setAttribute('aria-label', mostrando ? 'Mostrar contraseña' : 'Ocultar contraseña');

    if (window.lucide) lucide.createIcons();
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

/* ---------- Validación de contraseña ---------- */
// Requisitos: más de 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 símbolo especial
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{9,}$/;

/* ---------- Validación de nombre completo ---------- */
// Solo letras (incluye tildes y ñ) y espacios; sin números ni caracteres especiales
const NOMBRE_REGEX = /^[A-Za-zÀ-ÿ\u00f1\u00d1\s]+$/;

function validarNombre(nombre) {
    if (!nombre.trim()) {
        return "El nombre completo es obligatorio.";
    }
    if (!NOMBRE_REGEX.test(nombre)) {
        return "El nombre completo solo puede contener letras y espacios.";
    }
    return null; // válido
}

/* ---------- Validación de nombre de usuario ---------- */
// Solo letras y números, sin espacios ni caracteres especiales
const USERNAME_REGEX = /^[A-Za-z0-9]+$/;

function validarUsuario(usuario) {
    if (!usuario.trim()) {
        return "El nombre de usuario es obligatorio.";
    }
    if (/\s/.test(usuario)) {
        return "El nombre de usuario no puede contener espacios.";
    }
    if (!USERNAME_REGEX.test(usuario)) {
        return "El nombre de usuario solo puede contener letras y números, sin caracteres especiales.";
    }
    return null; // válido
}

function validarPassword(password) {
    if (password.length <= 8) {
        return "La contraseña debe tener más de 8 caracteres.";
    }
    if (!/[A-Z]/.test(password)) {
        return "La contraseña debe incluir al menos una letra mayúscula.";
    }
    if (!/[a-z]/.test(password)) {
        return "La contraseña debe incluir al menos una letra minúscula.";
    }
    if (!/\d/.test(password)) {
        return "La contraseña debe incluir al menos un número.";
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return "La contraseña debe incluir al menos un símbolo especial (ej. !@#$%).";
    }
    return null; // válida
}

/* ---------- Formularios (demo) ---------- */
async function iniciarSesion(event) {
    event.preventDefault();
    const usuario = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    try {
        const res = await fetch('../PHP/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password })
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
    const usuario = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const errorEl = document.getElementById('registerError');

    // Validación del nombre completo (solo letras y espacios)
    const errorNombre = validarNombre(nombre);
    if (errorNombre) {
        errorEl.textContent = errorNombre;
        errorEl.classList.add('active');
        return;
    }

    // Validación del nombre de usuario (sin espacios ni caracteres especiales)
    const errorUsuario = validarUsuario(usuario);
    if (errorUsuario) {
        errorEl.textContent = errorUsuario;
        errorEl.classList.add('active');
        return;
    }

    // Validación de coincidencia de contraseñas
    if (password !== confirmPassword) {
        errorEl.textContent = "Las contraseñas no coinciden.";
        errorEl.classList.add('active');
        return;
    }

    // Validación de requisitos de la contraseña (más de 8 caracteres, mayúscula, minúscula, número y símbolo)
    const errorValidacion = validarPassword(password);
    if (errorValidacion) {
        errorEl.textContent = errorValidacion;
        errorEl.classList.add('active');
        return;
    }

    try {
        const res = await fetch('../PHP/registro.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, usuario, email, password, confirmPassword })
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

/* ---------- Riel de progreso (avance del "tren" según el scroll) ---------- */
function setupNavProgress() {
    const progress = document.getElementById('navProgress');
    if (!progress) return;

    const update = () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const percent = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
        progress.style.width = percent + '%';
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
}

/* ---------- Estación activa en el rail de navegación ---------- */
function setupActiveStop() {
    const sectionIds = ['beneficios', 'cultura', 'horarios', 'Contacto'];
    const sections = sectionIds
        .map(id => document.getElementById(id))
        .filter(Boolean);

    if (!sections.length) return;

    const markActive = (id) => {
        document.querySelectorAll('.metro-stop').forEach(stop => {
            const targetId = stop.getAttribute('href')?.replace('#', '');
            stop.classList.toggle('active', targetId === id);
        });
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                markActive(entry.target.id);
            }
        });
    }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });

    sections.forEach(section => observer.observe(section));
}
