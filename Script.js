/* =====================================================================
   SUM — Sistema de Ubicación Metro · Script.js
   Lógica del lado del cliente: se ejecuta en el navegador del usuario.

   ÍNDICE
   1. Arranque de la página
   2. Menú móvil (hamburguesa)
   3. Mostrar / ocultar contraseña
   4. Ventanas modales (login, registro, recuperar contraseña)
   5. Validación del registro (reglas)
   6. Checklist de validación en vivo
   7. Comunicación con el servidor (PHP + base de datos)
   8. Efectos de scroll (aparición, progreso y parada activa)

   IDEA CLAVE PARA EXPONER
   Este archivo NO guarda datos: solo valida lo que escribe el usuario y se
   lo envía al servidor (PHP), que es quien consulta la base de datos.
   ===================================================================== */

// ==================================================================
// 1. ARRANQUE DE LA PÁGINA
// ==================================================================
// DOMContentLoaded se dispara cuando el HTML ya cargó por completo. Recién ahí
// se activan los efectos; antes, el JS buscaría elementos que todavía no
// existen.
document.addEventListener('DOMContentLoaded', () => {
    setupScrollReveal();  // aparición suave de las secciones al hacer scroll (sección 8)
    setupNavProgress();  // barra verde de progreso en el menú (sección 8)
    setupActiveStop();  // resalta en el menú la sección que se está viendo (sección 8)
    setupLiveValidation();  // checklist en vivo del registro (sección 6)
});

// ==================================================================
// 2. MENÚ MÓVIL (hamburguesa)
// ==================================================================
// Abre y cierra el menú de celular. Alterna la clase 'active': el CSS usa esa
// clase para mostrar u ocultar el panel y animar el icono de las 3 rayas.
function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    const toggle = document.getElementById('menuToggle');
    menu.classList.toggle('active');  // alterna: si no tenía la clase la agrega, si la tenía la quita
    toggle.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';  // bloquea el scroll del fondo mientras el menú está abierto
}

// ==================================================================
// 3. MOSTRAR / OCULTAR CONTRASEÑA
// ==================================================================
// Cambia el campo entre type='password' (puntos) y type='text' (visible), cambia
// el icono (ojo / ojo tachado) y el texto accesible del botón.
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const mostrando = input.type === 'text';  // ¿la contraseña está visible ahora mismo?
    input.type = mostrando ? 'password' : 'text';  // cambia el tipo de campo
    btn.querySelector('use').setAttribute('href', mostrando ? '#i-eye' : '#i-eye-off');  // cambia el icono del sprite SVG
    btn.setAttribute('aria-label', mostrando ? 'Mostrar contraseña' : 'Ocultar contraseña');
}

// ==================================================================
// 4. VENTANAS MODALES
// ==================================================================
// Un modal es una ventana emergente. Los tres (login, registro y recuperar) ya
// existen en el HTML pero están ocultos; se muestran agregando la clase 'active'
// y se ocultan quitándola. Cada función abrir...() cierra primero las otras para
// que solo haya una ventana a la vez.

// --- Recuperar contraseña ---
function abrirRecuperar() {
    cerrarLogin();
    document.getElementById('forgotModal').classList.add('active');
}

// Cierra el modal y limpia: oculta el mensaje de éxito y vacía el formulario
// (reset).
function cerrarRecuperar() {
    document.getElementById('forgotModal').classList.remove('active');
    document.getElementById('forgotSuccess').classList.remove('active');
    document.getElementById('forgotForm').reset();
}

// DEMOSTRATIVO: solo muestra el mensaje de éxito. Todavía no envía ningún
// correo; para hacerlo real habría que conectarlo a un PHP, igual que el login.
function recuperarPassword(event) {
    event.preventDefault();
    const successEl = document.getElementById('forgotSuccess');
    successEl.classList.add('active');
}

// --- Iniciar sesión ---
// Cierra los otros modales antes de abrir el de login.
function abrirLogin() {
    cerrarRegistro();
    cerrarRecuperar();
    document.getElementById('loginModal').classList.add('active');
}

// Cierra el modal y oculta el mensaje de error anterior.
function cerrarLogin() {
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('loginError').classList.remove('active');
}

// --- Registro ---
function abrirRegistro() {
    cerrarLogin();
    document.getElementById('registerModal').classList.add('active');
}

// Cierra el modal, oculta el error y también los cuadros de ayuda de los campos.
function cerrarRegistro() {
    document.getElementById('registerModal').classList.remove('active');
    document.getElementById('registerError').classList.remove('active');
    cerrarTodasLasInfo();
}

// Cerrar al hacer clic fuera: si el clic cae sobre el fondo oscuro (modal-
// overlay) y no sobre la caja blanca, se cierra esa ventana.
document.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

// Oculta todos los cuadros de ayuda (field-info) del formulario de registro.
function cerrarTodasLasInfo() {
    document.querySelectorAll('.field-info.active').forEach(info => info.classList.remove('active'));
}

// ==================================================================
// 5. VALIDACIÓN DEL REGISTRO (reglas)
// ==================================================================
// Una expresión regular (regex) es un patrón que sirve para comprobar cómo está
// escrito un texto.
// Las funciones validar...() devuelven un mensaje de error (texto) si el dato no
// es válido, o null si todo está bien. Así registrarUsuario() sabe si debe
// detener el envío.

// Contraseña: mínimo 9 caracteres con minúscula, mayúscula, número y símbolo.
// (Queda como referencia: la validación real usa reglas separadas en
// validarPassword() para dar un mensaje específico por cada error.)
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{9,}$/;

// Nombre: solo letras (con tildes y ñ) y espacios.
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

// Usuario: solo letras y números, sin espacios ni símbolos.
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

// Revisa la contraseña regla por regla y devuelve el primer error que encuentre.
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

// Correo: texto@dominio.ext, sin espacios (se usa en el checklist en vivo).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ==================================================================
// 6. CHECKLIST DE VALIDACIÓN EN VIVO
// ==================================================================
// Mientras el usuario escribe, cada requisito pasa de ○ (neutro) a ✓ (cumple) o
// ✕ (falla).
// Cómo funciona:
//   1) una función evaluar...() devuelve un objeto con true/false por cada
//     regla;
//   2) actualizarChecklist() recorre los <li data-rule='...'> del HTML y les
//     pone la clase 'valid' o 'invalid';
//   3) el CSS dibuja el símbolo y el color según esa clase.
// El parámetro 'evaluador' es una función que se pasa como argumento: así se
// reutiliza el mismo código para nombre, usuario, correo y contraseña.
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

// Funciones evaluar...(): devuelven { regla: true/false }. Los nombres de las
// reglas deben coincidir con los data-rule del HTML.
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

// Muestra el cuadro de ayuda al entrar al campo (focus) y lo oculta 20 segundos
// después de salir (blur).
// El temporizador se cancela si el usuario vuelve al campo antes de que termine.
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

// Conecta cada campo con su checklist usando el evento 'input' (se dispara con
// cada tecla).
// Si cambia la contraseña y ya hay texto en 'confirmar', también se vuelve a
// comprobar la coincidencia.
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

// ==================================================================
// 7. COMUNICACIÓN CON EL SERVIDOR (PHP + BASE DE DATOS)
// ==================================================================
// Flujo: el usuario envía el formulario → el JS valida → fetch() manda los datos
// en JSON al PHP → el PHP consulta la base de datos y responde con exito y
// mensaje → el JS muestra el error o redirige al mapa.
// async/await hace que el código espere la respuesta del servidor sin congelar
// la página.
// NO RENOMBRAR: las claves usuario, password, nombre, email, confirmPassword,
// exito y mensaje, y las rutas ../PHP/..., deben coincidir con login.php y
// registro.php.
// Seguridad: en producción usar HTTPS; el PHP debe volver a validar todo y
// guardar la contraseña con password_hash().

// --- Iniciar sesión --- Envía usuario y contraseña a login.php.
async function iniciarSesion(event) {
    event.preventDefault();  // evita que el formulario recargue la página
    const usuario = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    try {
        const res = await fetch('../PHP/login.php', {  // petición POST al script PHP; await espera la respuesta
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password })
        });
        const data = await res.json();  // respuesta del servidor: { exito, mensaje }
        if (!data.exito) {  // el servidor rechazó los datos
            errorEl.textContent = data.mensaje;
            errorEl.classList.add('active');
            return;
        }
        errorEl.classList.remove('active');
        cerrarLogin();
        window.location.href = "../MAPA/mapa.html";  // inicio de sesión correcto: va a la página del mapa
    } catch (err) {  // falla de red o servidor apagado
        errorEl.textContent = "Error de conexión con el servidor.";
        errorEl.classList.add('active');
    }
}

// --- Registro --- Valida en este orden: nombre → usuario → contraseñas iguales
// → seguridad de la contraseña. Se detiene (return) en el primer error y solo
// después consulta al servidor (registro.php).
async function registrarUsuario(event) {
    event.preventDefault();  // evita que el formulario recargue la página
    const nombre = document.getElementById('regNombre').value;
    const usuario = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const errorEl = document.getElementById('registerError');
    const errorNombre = validarNombre(nombre);
    if (errorNombre) {
        errorEl.textContent = errorNombre;
        errorEl.classList.add('active');
        return;
    }
    const errorUsuario = validarUsuario(usuario);
    if (errorUsuario) {
        errorEl.textContent = errorUsuario;
        errorEl.classList.add('active');
        return;
    }
    if (password !== confirmPassword) {
        errorEl.textContent = "Las contraseñas no coinciden.";
        errorEl.classList.add('active');
        return;
    }
    const errorValidacion = validarPassword(password);
    if (errorValidacion) {
        errorEl.textContent = errorValidacion;
        errorEl.classList.add('active');
        return;
    }
    try {
        const res = await fetch('../PHP/registro.php', {  // petición POST a registro.php
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, usuario, email, password, confirmPassword })
        });
        const data = await res.json();  // respuesta del servidor: { exito, mensaje }
        if (!data.exito) {
            errorEl.textContent = data.mensaje;
            errorEl.classList.add('active');
            return;
        }
        errorEl.classList.remove('active');
        cerrarRegistro();
        window.location.href = "../MAPA/mapa.html";  // registro correcto: va a la página del mapa
    } catch (err) {  // falla de red o servidor apagado
        errorEl.textContent = "Error de conexión con el servidor.";
        errorEl.classList.add('active');
    }
}

// ==================================================================
// 8. EFECTOS DE SCROLL
// ==================================================================
// IntersectionObserver avisa cuando un elemento entra en pantalla; es más
// eficiente que escuchar el scroll todo el tiempo.

// Aparición al hacer scroll: los elementos .fade-in empiezan ocultos (reveal-
// pending) y al verse un 15% (threshold 0.15) reciben la clase 'visible'.
// unobserve() hace que la animación ocurra una sola vez.
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

// Barra de progreso: porcentaje = scroll actual / (alto total − alto visible).
// Ese % es el ancho de la barra verde del riel del menú. { passive: true }
// mejora el rendimiento del scroll.
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

// Parada activa: marca con la clase 'active' el enlace del menú cuya sección
// está en una franja central de la pantalla (rootMargin −40% arriba y −50%
// abajo).
// Los ids de la lista deben escribirse igual que en el HTML (incluida 'Contacto'
// con C mayúscula).
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
