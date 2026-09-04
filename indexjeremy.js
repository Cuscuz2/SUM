document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    setupScrollReveal();
    setupNavProgress();
    setupActiveStop();
    setupLiveValidation();
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
    cerrarTodasLasInfo();
}

// Cerrar modal al hacer clic fuera del contenido
document.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

/* ---------- Ventanas emergentes con los parámetros de cada campo ---------- */
function cerrarTodasLasInfo() {
    document.querySelectorAll('.field-info.active').forEach(info => info.classList.remove('active'));
}

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

/* ---------- Validación de correo (para el checklist en vivo) ---------- */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------- Checklist en vivo: se corrige mientras el usuario escribe ---------- */
function actualizarChecklist(infoId, valor, evaluador) {
    const contenedor = document.getElementById(infoId);
    if (!contenedor) return;
    const resultados = evaluador(valor);

    contenedor.querySelectorAll('li[data-rule]').forEach(li => {
        const regla = li.getAttribute('data-rule');
        li.classList.remove('valid', 'invalid');
        if (valor.length === 0) return; // campo vacío: estado neutro (○)
        li.classList.add(resultados[regla] ? 'valid' : 'invalid');
    });
}

function evaluarNombre(v) {
    return { soloLetras: NOMBRE_REGEX.test(v) };
}
function evaluarUsuario(v) {
    return {
        sinEspacios: !/\s/.test(v),
        soloAlfanum: USERNAME_REGEX.test(v)
    };
}
function evaluarCorreo(v) {
    return { formatoCorreo: EMAIL_REGEX.test(v) };
}
function evaluarPassword(v) {
    return {
        longitud: v.length > 8,
        mayuscula: /[A-Z]/.test(v),
        minuscula: /[a-z]/.test(v),
        numero: /\d/.test(v),
        simbolo: /[^A-Za-z0-9]/.test(v)
    };
}
function evaluarConfirmPassword(v) {
    const original = document.getElementById('regPassword').value;
    return { coincide: v.length > 0 && v === original };
}

// Abre el checklist del campo al enfocarlo y lo cierra 20s después de salir de él
function enlazarAperturaEnFoco(inputId, infoId) {
    const input = document.getElementById(inputId);
    const info = document.getElementById(infoId);
    if (!input || !info) return;

    let temporizadorCierre = null;

    input.addEventListener('focus', () => {
        if (temporizadorCierre) clearTimeout(temporizadorCierre);
        cerrarTodasLasInfo();
        info.classList.add('active');
    });

    input.addEventListener('blur', () => {
        temporizadorCierre = setTimeout(() => {
            info.classList.remove('active');
        }, 20000); // 20 segundos de espera antes de ocultar el mensaje
    });
}

function setupLiveValidation() {
    const regNombre = document.getElementById('regNombre');
    const regUsername = document.getElementById('regUsername');
    const regEmail = document.getElementById('regEmail');
    const regPassword = document.getElementById('regPassword');
    const regConfirmPassword = document.getElementById('regConfirmPassword');

    if (!regNombre) return; // el formulario de registro no está en esta página

    regNombre.addEventListener('input', e => actualizarChecklist('infoNombre', e.target.value, evaluarNombre));
    regUsername.addEventListener('input', e => actualizarChecklist('infoUsuario', e.target.value, evaluarUsuario));
    regEmail.addEventListener('input', e => actualizarChecklist('infoCorreo', e.target.value, evaluarCorreo));

    regPassword.addEventListener('input', e => {
        actualizarChecklist('infoPassword', e.target.value, evaluarPassword);
        // Si ya se escribió la confirmación, revalidarla también al cambiar la contraseña
        if (regConfirmPassword.value.length > 0) {
            actualizarChecklist('infoConfirmPassword', regConfirmPassword.value, evaluarConfirmPassword);
        }
    });

    regConfirmPassword.addEventListener('input', e => actualizarChecklist('infoConfirmPassword', e.target.value, evaluarConfirmPassword));

    enlazarAperturaEnFoco('regNombre', 'infoNombre');
    enlazarAperturaEnFoco('regUsername', 'infoUsuario');
    enlazarAperturaEnFoco('regEmail', 'infoCorreo');
    enlazarAperturaEnFoco('regPassword', 'infoPassword');
    enlazarAperturaEnFoco('regConfirmPassword', 'infoConfirmPassword');
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
