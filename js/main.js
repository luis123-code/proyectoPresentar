/**
 * ==============================================================================
 * StockPro - Landing Page Profesional
 * Curso: Desarrollo de Interfaces I | Instituto IDAT
 * Archivo: js/main.js
 * Descripción: Interactividad de la página de inicio en JavaScript Vanilla (ES6+).
 *
 * Guía de lectura:
 * - Efectos al desplazarse: navbar, botón "volver arriba" y revelado de secciones.
 * - Animaciones: contadores de métricas y titular que se escribe progresivamente.
 * - Formulario: validación de datos y simulación visual de un envío exitoso.
 * - La inicialización se ejecuta cuando el navegador termina de construir el DOM.
 * ==============================================================================
 */

'use strict';

/* ==============================================================================
   1. NAVBAR DINÁMICA CON SCROLL Y BOTÓN VOLVER ARRIBA
   ============================================================================== */

/**
 * Controla el cambio de fondo de la navbar y visibilidad del botón "Volver arriba".
 */
function configurarEfectosScroll() {
    const navbar = document.getElementById('navbarPrincipal');
    const btnVolverArriba = document.getElementById('btnVolverArriba');

    // Un único listener actualiza los elementos que dependen de la posición de la página.
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY || document.documentElement.scrollTop;

        // 1. Navbar: Fondo transparente a sólido al bajar más de 40px
        if (navbar) {
            if (scrollY > 40) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        }

        // 2. Botón flotante "Volver arriba" visible al bajar más de 350px
        if (btnVolverArriba) {
            if (scrollY > 350) {
                btnVolverArriba.classList.add('visible');
            } else {
                btnVolverArriba.classList.remove('visible');
            }
        }
    }, { passive: true }); // passive indica que este listener no cancelará el desplazamiento.

    // Click en botón volver arriba
    if (btnVolverArriba) {
        btnVolverArriba.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Cierre automático del menú hamburguesa al pulsar un enlace en móviles
    const navLinks = document.querySelectorAll('#navbarLinks .nav-link, #navbarLinks .btn');
    const navbarCollapse = document.getElementById('navbarLinks');

    if (navbarCollapse && window.bootstrap) {
        for (const link of navLinks) {
            link.addEventListener('click', () => {
                if (navbarCollapse.classList.contains('show')) {
                    const bsCollapse = window.bootstrap.Collapse.getInstance(navbarCollapse);
                    if (bsCollapse) {
                        bsCollapse.hide();
                    }
                }
            });
        }
    }

    inicializarAnimacionScroll();
}

/**
 * Revela las secciones al entrar en pantalla durante el desplazamiento.
 */
function inicializarAnimacionScroll() {
    const secciones = document.querySelectorAll(
        '#metricas, #beneficios, #funciones, #como-funciona, #testimonios, #preguntas, #contacto, .final-cta'
    );

    if (!('IntersectionObserver' in window)) return;

    // El navegador detecta la entrada en pantalla sin consultar la posición en cada scroll.
    const observer = new IntersectionObserver((entries, obs) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target); // Cada sección se anima una sola vez.
            }
        }
    }, {
        threshold: 0.12
    });

    for (const section of secciones) {
        section.classList.add('scroll-reveal');
        observer.observe(section);
    }
}

/* ==============================================================================
   2. CONTADORES ANIMADOS CON INTERSECTION OBSERVER
   ============================================================================== */

/**
 * Anima un contador numérico desde 0 hasta el valor objetivo.
 * @param {HTMLElement} elemento - Elemento con el atributo data-target.
 */
function animarNumero(elemento) {
    const objetivo = parseInt(elemento.dataset.target, 10);
    if (isNaN(objetivo)) return;

    // Si el usuario prefiere reducir movimiento, asignar directo
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
        elemento.textContent = objetivo >= 1000 ? objetivo.toLocaleString('es-PE') : objetivo;
        return;
    }

    // Se reparte el incremento en pasos para mostrar el conteo durante 1.8 segundos.
    const duracion = 1800;
    const pasos = 50;
    const incremento = objetivo / pasos;
    let actual = 0;
    const intervaloMs = duracion / pasos;

    const timer = setInterval(() => {
        actual += incremento;
        if (actual >= objetivo) {
            actual = objetivo;
            clearInterval(timer);
        }

        const valorEntero = Math.floor(actual);
        elemento.textContent = valorEntero >= 1000 
            ? valorEntero.toLocaleString('es-PE') 
            : valorEntero;
    }, intervaloMs);
}

/**
 * Inicializa el IntersectionObserver para disparar los contadores al entrar en pantalla.
 */
function inicializarContadoresAnimados() {
    const contadores = document.querySelectorAll('.counter-number');
    if (contadores.length === 0) return;

    // Espera a que el contador aparezca en pantalla antes de iniciar su animación.
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    animarNumero(entry.target);
                    obs.unobserve(entry.target); // Animar solo una vez
                }
            }
        }, {
            threshold: 0.3
        });

        for (const contador of contadores) {
            observer.observe(contador);
        }
    } else {
        // Fallback en caso de navegadores antiguos
        for (const contador of contadores) {
            animarNumero(contador);
        }
    }
}

/**
 * Escribe el titular principal de forma progresiva, respetando movimiento reducido.
 */
function inicializarEfectoEscritura() {
    const prefijo = document.querySelector('.hero-typewriter-prefix');
    const destacado = document.querySelector('.hero-typewriter-highlight');
    if (!prefijo || !destacado) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Textos que se alternan en el titular principal de la landing.
    const frases = [
        {
            prefijo: 'Controla tu inventario en segundos, ',
            destacado: 'sin complicaciones ni pérdidas.'
        },
        {
            prefijo: 'Anticípate a la falta de stock, ',
            destacado: 'con alertas de reposición.'
        },
        {
            prefijo: 'Mantén tu bodega organizada, ',
            destacado: 'y tus ventas bajo control.'
        }
    ];

    prefijo.textContent = '';
    destacado.textContent = '';

    // Escribe un texto carácter por carácter y llama al callback cuando termina.
    const escribir = (elemento, texto, alTerminar) => {
        elemento.classList.add('typing-cursor');
        const caracteres = Array.from(texto);
        let indice = 0;

        const escribirCaracter = () => {
            if (indice >= caracteres.length) {
                elemento.classList.remove('typing-cursor');
                alTerminar();
                return;
            }

            const caracter = caracteres[indice];
            elemento.textContent += caracter;
            indice += 1;
            window.setTimeout(escribirCaracter, caracter === ' ' ? 45 : 72);
        };

        escribirCaracter();
    };

    // Borra el texto actual antes de pasar a la siguiente frase.
    const borrar = (elemento, alTerminar) => {
        elemento.classList.add('typing-cursor');

        const borrarCaracter = () => {
            const caracteres = Array.from(elemento.textContent);
            if (caracteres.length === 0) {
                elemento.classList.remove('typing-cursor');
                alTerminar();
                return;
            }

            caracteres.pop();
            elemento.textContent = caracteres.join('');
            window.setTimeout(borrarCaracter, 36);
        };

        borrarCaracter();
    };

    // Coordina escritura y borrado para mostrar las frases en orden.
    const escribirFrase = (indiceFrase) => {
        const frase = frases[indiceFrase];
        escribir(prefijo, frase.prefijo, () => {
            escribir(destacado, frase.destacado, () => {
                if (indiceFrase === frases.length - 1) return;

                window.setTimeout(() => {
                    borrar(destacado, () => {
                        borrar(prefijo, () => {
                            window.setTimeout(() => escribirFrase(indiceFrase + 1), 250);
                        });
                    });
                }, 2200);
            });
        });
    };

    window.setTimeout(() => escribirFrase(0), 250);
}

/* ==============================================================================
   3. VALIDACIÓN EN VIVO DEL FORMULARIO DE CONTACTO
   ============================================================================== */

/**
 * Valida un campo individual y aplica las clases is-valid / is-invalid de Bootstrap.
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} campo
 * @param {boolean} esValido
 * @param {string} mensajeError
 */
function setCampoValidacion(campo, esValido, mensajeError = '') {
    if (!campo) return;

    if (esValido) {
        campo.classList.remove('is-invalid');
        campo.classList.add('is-valid');
    } else {
        campo.classList.remove('is-valid');
        campo.classList.add('is-invalid');

        // El mensaje puede estar junto al campo o dentro de la columna del formulario.
        const feedback = campo.parentElement.querySelector('.invalid-feedback') ||
                         campo.closest('.col-12, .col-sm-6')?.querySelector('.invalid-feedback');
        if (feedback && mensajeError) {
            feedback.textContent = mensajeError;
            feedback.style.display = 'block';
        }
    }
}

/**
 * Valida todos los campos del formulario de contacto.
 * @returns {boolean} True si el formulario es 100% válido.
 */
function validarFormularioContacto() {
    const inputNombre = document.getElementById('inputContactoNombre');
    const inputEmail = document.getElementById('inputContactoEmail');
    const inputTelefono = document.getElementById('inputContactoTelefono');
    const selectTipo = document.getElementById('selectContactoTipo');

    // Se revisan todos los campos y se conserva el resultado global para decidir el envío.
    let formularioCorrecto = true;

    // 1. Validar Nombre (mínimo 3 caracteres alfanuméricos)
    const valNombre = inputNombre.value.trim();
    if (valNombre.length < 3) {
        setCampoValidacion(inputNombre, false, 'Ingrese su nombre completo (mínimo 3 letras).');
        formularioCorrecto = false;
    } else {
        setCampoValidacion(inputNombre, true);
    }

    // 2. Validar Correo Electrónico
    const valEmail = inputEmail.value.trim();
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(valEmail)) {
        setCampoValidacion(inputEmail, false, 'Ingrese una dirección de correo válida.');
        formularioCorrecto = false;
    } else {
        setCampoValidacion(inputEmail, true);
    }

    // 3. Validar Teléfono (exactamente 9 dígitos numéricos peruanos)
    const valTel = inputTelefono.value.trim();
    const feedbackTel = document.getElementById('feedbackTelefono');
    const regexTel = /^9\d{8}$/; // En Perú los celulares empiezan con 9 y tienen 9 dígitos

    if (!regexTel.test(valTel)) {
        setCampoValidacion(inputTelefono, false);
        if (feedbackTel) feedbackTel.style.display = 'block';
        formularioCorrecto = false;
    } else {
        setCampoValidacion(inputTelefono, true);
        if (feedbackTel) feedbackTel.style.display = 'none';
    }

    // 4. Validar Tipo de Negocio
    const valTipo = selectTipo.value;
    if (!valTipo || valTipo === '') {
        setCampoValidacion(selectTipo, false, 'Por favor seleccione el tipo de negocio.');
        formularioCorrecto = false;
    } else {
        setCampoValidacion(selectTipo, true);
    }

    return formularioCorrecto;
}

/**
 * Inicializa el comportamiento y validación en vivo del formulario de contacto.
 */
function inicializarFormularioContacto() {
    const form = document.getElementById('formContactoLanding');
    if (!form) return;

    // Modal de estado del envío y confirmación de la solicitud.
    const modalEl = document.getElementById('modalContactoExito');
    let bsModalExito = null;
    if (modalEl && window.bootstrap) {
        bsModalExito = new window.bootstrap.Modal(modalEl, {
            backdrop: 'static',
            keyboard: false
        });
    }

    // Validación reactiva al escribir o cambiar campos
    // Revalidar al escribir y al salir del campo ayuda a corregir errores antes del envío.
    const campos = form.querySelectorAll('input, select, textarea');
    for (const campo of campos) {
        campo.addEventListener('input', () => {
            validarFormularioContacto();
        });
        campo.addEventListener('blur', () => {
            validarFormularioContacto();
        });
    }

    // Manejar envío (Submit)
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const esValido = validarFormularioContacto();
        if (!esValido) {
            // Foco al primer campo erróneo
            const primerInvalido = form.querySelector('.is-invalid');
            if (primerInvalido) primerInvalido.focus();
            return;
        }

        // Es una demostración visual: actualmente no se envían los datos a un servidor.
        const btnEnviar = document.getElementById('btnEnviarContacto');
        const estadoEnviando = document.getElementById('estadoEnviandoContacto');
        const estadoExito = document.getElementById('estadoExitoContacto');
        const footerExito = document.getElementById('footerExitoContacto');
        const btnCerrar = document.getElementById('btnCerrarContacto');
        const textoEstado = document.getElementById('textoEstadoContacto');
        const iconoEstado = document.getElementById('iconoEstadoContacto');

        estadoEnviando?.classList.remove('d-none');
        estadoExito?.classList.add('d-none');
        footerExito?.classList.add('d-none');
        btnCerrar?.classList.add('d-none');
        if (textoEstado) textoEstado.textContent = 'Enviando tu solicitud...';
        if (iconoEstado) iconoEstado.className = 'bi bi-send-fill text-accent';

        if (btnEnviar) {
            btnEnviar.disabled = true;
            btnEnviar.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Procesando solicitud...';
        }

        if (bsModalExito) bsModalExito.show();

        setTimeout(() => {
            // Restablecer botón
            if (btnEnviar) {
                btnEnviar.disabled = false;
                btnEnviar.innerHTML = '<i class="bi bi-send-fill me-2" aria-hidden="true"></i><span class="fw-bold">Enviar solicitud y probar gratis</span>';
            }

            estadoEnviando?.classList.add('d-none');
            estadoExito?.classList.remove('d-none');
            footerExito?.classList.remove('d-none');
            btnCerrar?.classList.remove('d-none');
            if (textoEstado) textoEstado.textContent = 'Solicitud lista';
            if (iconoEstado) iconoEstado.className = 'bi bi-check-circle-fill text-success';

            // Limpiar formulario y clases
            form.reset();
            for (const c of campos) {
                c.classList.remove('is-valid', 'is-invalid');
            }
            const feedbackTel = document.getElementById('feedbackTelefono');
            if (feedbackTel) feedbackTel.style.display = 'none';

        }, 700);
    });
}

/* ==============================================================================
   4. INICIALIZACIÓN GLOBAL DE LA PÁGINA (DOMCONTENTLOADED)
   ============================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // Punto de entrada: prepara los comportamientos cuando los elementos HTML ya existen.
    // 1. Configurar efectos de navbar y botón volver arriba
    configurarEfectosScroll();

    // 2. Inicializar contadores animados con IntersectionObserver
    inicializarContadoresAnimados();

    // 3. Animar el titular con efecto de escritura
    inicializarEfectoEscritura();

    // 4. Vincular validaciones y submit del formulario de contacto
    inicializarFormularioContacto();
});
