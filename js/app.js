¿
// Se ejecuta en modo estricto para buenas prácticas de desarrollo
'use strict';

/* ==============================================================================
   1. CONSTANTES GLOBALES Y ESTADO DE LA APLICACIÓN
   ============================================================================== */

/** Nombre de la clave bajo la que se guarda el inventario en el navegador. */
const STORAGE_KEY = 'stockpro_inventario_idat';

/** Límite de filas que se muestran en cada página de la tabla. */
const PRODUCTOS_POR_PAGINA = 8;

/** Lista central de categorías válidas para formularios y cálculos. */
const CATEGORIAS_VALIDAS = [
    'Abarrotes',
    'Bebidas',
    'Lácteos',
    'Limpieza',
    'Snacks',
    'Otros'
];

const ICONOS_CATEGORIA = {
    Abarrotes: 'bi-basket-fill',
    Bebidas: 'bi-cup-straw',
    'Lácteos': 'bi-cup-hot',
    Limpieza: 'bi-stars',
    Snacks: 'bi-cookie',
    Otros: 'bi-box-seam'
};

/**
 * Catálogo de ejemplo usado la primera vez que se abre la aplicación y al restablecerla.
 * Cada producto contiene identificador, código, nombre, categoría, precio, existencias,
 * umbral de stock mínimo y fecha de creación.
 */
const PRODUCTOS_INICIALES = [
    {
        id: 'p-1',
        codigo: 'PROD-001',
        nombre: 'Arroz Extra Costeño 1kg',
        categoria: 'Abarrotes',
        precio: 4.80,
        stock: 45,
        stockMinimo: 10,
        fechaCreacion: '2026-10-01'
    },
    {
        id: 'p-2',
        codigo: 'PROD-002',
        nombre: 'Aceite Vegetal Primor 900ml',
        categoria: 'Abarrotes',
        precio: 9.50,
        stock: 24,
        stockMinimo: 8,
        fechaCreacion: '2026-10-02'
    },
    {
        id: 'p-3',
        codigo: 'PROD-003',
        nombre: 'Leche Evaporada Gloria Azul 400g',
        categoria: 'Lácteos',
        precio: 4.20,
        stock: 6,
        stockMinimo: 12, // Stock bajo (6 <= 12)
        fechaCreacion: '2026-10-03'
    },
    {
        id: 'p-4',
        codigo: 'PROD-004',
        nombre: 'Yogurt Fresa Gloria 1 Litro',
        categoria: 'Lácteos',
        precio: 6.90,
        stock: 18,
        stockMinimo: 6,
        fechaCreacion: '2026-10-04'
    },
    {
        id: 'p-5',
        codigo: 'PROD-005',
        nombre: 'Gaseosa Inca Kola Sin Azúcar 1.5L',
        categoria: 'Bebidas',
        precio: 6.50,
        stock: 32,
        stockMinimo: 10,
        fechaCreacion: '2026-10-05'
    },
    {
        id: 'p-6',
        codigo: 'PROD-006',
        nombre: 'Agua Mineral San Luis 625ml',
        categoria: 'Bebidas',
        precio: 2.00,
        stock: 4,
        stockMinimo: 15, // Stock bajo (4 <= 15)
        fechaCreacion: '2026-10-06'
    },
    {
        id: 'p-7',
        codigo: 'PROD-007',
        nombre: 'Detergente Ace Floral 750g',
        categoria: 'Limpieza',
        precio: 7.80,
        stock: 20,
        stockMinimo: 6,
        fechaCreacion: '2026-10-07'
    },
    {
        id: 'p-8',
        codigo: 'PROD-008',
        nombre: 'Lavavajillas Sapolio Limón 500g',
        categoria: 'Limpieza',
        precio: 4.50,
        stock: 0,
        stockMinimo: 5, // Agotado (stock === 0)
        fechaCreacion: '2026-10-08'
    },
    {
        id: 'p-9',
        codigo: 'PROD-009',
        nombre: 'Galletas Casino Fresa Pack x6',
        categoria: 'Snacks',
        precio: 3.60,
        stock: 50,
        stockMinimo: 12,
        fechaCreacion: '2026-10-09'
    },
    {
        id: 'p-10',
        codigo: 'PROD-010',
        nombre: 'Papas Lays Clásicas 85g',
        categoria: 'Snacks',
        precio: 4.20,
        stock: 5,
        stockMinimo: 10, // Stock bajo (5 <= 10)
        fechaCreacion: '2026-10-10'
    },
    {
        id: 'p-11',
        codigo: 'PROD-011',
        nombre: 'Fideos Spaghetti Don Vittorio 500g',
        categoria: 'Abarrotes',
        precio: 3.30,
        stock: 40,
        stockMinimo: 10,
        fechaCreacion: '2026-10-11'
    },
    {
        id: 'p-12',
        codigo: 'PROD-012',
        nombre: 'Pilas Alcalinas Duracell AA Pack x4',
        categoria: 'Otros',
        precio: 14.90,
        stock: 15,
        stockMinimo: 4,
        fechaCreacion: '2026-10-12'
    }
];

/** Datos y controles que cambian mientras la aplicación está abierta. */
let productos = [];
let paginaActual = 1;
let productoEliminarId = null;
let callbackConfirmacionAccion = null;
let ultimoElementoFoco = null; // Para devolver el foco al cerrar modales

/** Criterios actuales de búsqueda, estado, precio y orden de la tabla. */
const filtros = {
    busqueda: '',
    categoria: 'todas',
    estado: 'todos', // 'todos' | 'disponible' | 'stock_bajo' | 'agotado'
    precioMin: null,
    precioMax: null,
    orden: 'nombre_asc'
};

/* ==============================================================================
   2. INSTANCIAS DE COMPONENTES BOOTSTRAP (MODALES, TOAST, OFFCANVAS)
   Se crean al iniciar la página y se reutilizan para abrir/cerrar cada componente.
   ============================================================================== */
let bsModalProducto = null;
let bsModalMovimiento = null;
let bsModalDetalle = null;
let bsModalEliminar = null;
let bsModalConfirmarAccion = null;
let bsModalResumen = null;
let bsOffcanvasFiltros = null;
let bsToastNotificacion = null;

/* ==============================================================================
   3. FUNCIONES DE UTILIDAD Y SANITIZACIÓN (XSS & FORMATOS)
   ============================================================================== */

/**
 * Escapa caracteres especiales de HTML para prevenir inyecciones XSS.
 * @param {string} str - Texto a escapar.
 * @returns {string} Texto seguro para insertar en el DOM.
 */
function escapeHTML(str) {
    if (typeof str !== 'string') {
        return '';
    }
    // Codificar los caracteres que el navegador interpretaría como marcado HTML.
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Da formato de moneda peruana (Soles).
 * @param {number} valor - Monto numérico.
 * @returns {string} Ejemplo: "S/ 1,234.50"
 */
function formatearSoles(valor) {
    const numero = typeof valor === 'number' && !isNaN(valor) ? valor : 0;
    return 'S/ ' + numero.toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Determina el estado de un producto según su stock.
 * @param {number} stock - Existencia actual.
 * @param {number} stockMinimo - Umbral de stock mínimo.
 * @returns {{ clave: string, etiqueta: string, badgeClase: string }}
 */
function obtenerEstadoProducto(stock, stockMinimo) {
    // El stock igual a cero tiene prioridad sobre la regla general de stock bajo.
    if (stock === 0) {
        return {
            clave: 'agotado',
            etiqueta: 'Agotado',
            badgeClase: 'badge bg-secondary text-white'
        };
    } else if (stock <= stockMinimo) {
        return {
            clave: 'stock_bajo',
            etiqueta: 'Stock bajo',
            badgeClase: 'badge bg-danger text-white'
        };
    } else {
        return {
            clave: 'disponible',
            etiqueta: 'Disponible',
            badgeClase: 'badge bg-success text-white'
        };
    }
}

/**
 * Muestra un Toast flotante de Bootstrap con el mensaje y tipo indicado.
 * El verbo debe coincidir con la acción ejecutada.
 * @param {string} mensaje - Mensaje a mostrar.
 * @param {'success' | 'danger' | 'warning' | 'info'} tipo - Tipo de notificación.
 */
function mostrarToast(mensaje, tipo = 'success') {
    const toastEl = document.getElementById('toastNotificacion');
    const toastMensaje = document.getElementById('toastMensaje');
    const toastIcono = document.getElementById('toastIcono');

    if (!toastEl || !toastMensaje || !toastIcono) return;

    // Remover clases de fondo previas
    toastEl.className = 'toast align-items-center border-0 shadow text-white';

    // Asignar color e icono según el tipo
    switch (tipo) {
        case 'success':
            toastEl.classList.add('bg-success');
            toastIcono.className = 'bi bi-check-circle-fill fs-5 text-white';
            break;
        case 'danger':
            toastEl.classList.add('bg-danger');
            toastIcono.className = 'bi bi-x-circle-fill fs-5 text-white';
            break;
        case 'warning':
            toastEl.classList.add('bg-warning', 'text-dark');
            toastIcono.className = 'bi bi-exclamation-triangle-fill fs-5 text-dark';
            break;
        case 'info':
        default:
            toastEl.classList.add('bg-navy');
            toastIcono.className = 'bi bi-info-circle-fill fs-5 text-accent';
            break;
    }

    toastMensaje.textContent = mensaje;

    if (bsToastNotificacion) {
        bsToastNotificacion.show();
    }
}

/* ==============================================================================
   4. GESTIÓN DE PERSISTENCIA (LOCALSTORAGE)
   ============================================================================== */

/**
 * Carga los productos desde localStorage o inicializa con los datos de ejemplo.
 */
function cargarProductosDesdeStorage() {
    try {
        // JSON.parse convierte el texto guardado nuevamente en un arreglo de productos.
        const dataGuardada = localStorage.getItem(STORAGE_KEY);
        if (dataGuardada) {
            const parsed = JSON.parse(dataGuardada);
            if (Array.isArray(parsed) && parsed.length > 0) {
                productos = parsed;
                return;
            }
        }
    } catch (error) {
        console.error('Error al leer localStorage:', error);
    }
    // Si no existe un inventario válido, empezar con una copia de los datos de ejemplo.
    // La copia evita modificar PRODUCTOS_INICIALES al editar productos durante la sesión.
    productos = JSON.parse(JSON.stringify(PRODUCTOS_INICIALES));
    guardarProductosEnStorage();
}

/**
 * Guarda el array de productos actual en localStorage.
 */
function guardarProductosEnStorage() {
    try {
        // localStorage solo admite texto, por eso el arreglo se serializa como JSON.
        localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
    } catch (error) {
        console.error('Error al guardar en localStorage:', error);
        mostrarToast('Error al persistir datos en almacenamiento local', 'danger');
    }
}

/* ==============================================================================
   5. CÁLCULOS ESTADÍSTICOS Y MÉTRICAS DEL INVENTARIO
   ============================================================================== */

/**
 * Calcula los totales globales del inventario.
 * @returns {{ totalProductos: number, totalUnidades: number, valorTotal: number, totalStockBajo: number, productosBajoStock: Array }}
 */
function calcularMetricasInventario() {
    const totalProductos = productos.length;
    let totalUnidades = 0;
    let valorTotal = 0;
    const productosBajoStock = [];

    // Cada unidad aporta al total y cada producto aporta stock * precio al valor inventariado.
    for (const prod of productos) {
        totalUnidades += prod.stock;
        valorTotal += (prod.stock * prod.precio);

        // Si stock es menor o igual al mínimo (incluyendo stock = 0)
        if (prod.stock <= prod.stockMinimo) {
            productosBajoStock.push(prod);
        }
    }

    return {
        totalProductos,
        totalUnidades,
        valorTotal,
        totalStockBajo: productosBajoStock.length,
        productosBajoStock
    };
}

/**
 * Calcula el valor acumulado y porcentaje por cada categoría.
 * @param {number} valorTotalGeneral - Valor total global del inventario.
 * @returns {Array<{ categoria: string, total: number, cantidad: number, porcentaje: number }>}
 */
function calcularValorPorCategoria(valorTotalGeneral) {
    const resultado = [];

    // Recorrer las categorías válidas
    for (const cat of CATEGORIAS_VALIDAS) {
        let sumaValor = 0;
        let cantidadItems = 0;

        for (const prod of productos) {
            if (prod.categoria === cat) {
                sumaValor += (prod.stock * prod.precio);
                cantidadItems += 1;
            }
        }

        // Si el inventario no tiene valor, se evita dividir entre cero.
        const porcentaje = valorTotalGeneral > 0 
            ? ((sumaValor / valorTotalGeneral) * 100).toFixed(1) 
            : 0;

        resultado.push({
            categoria: cat,
            total: sumaValor,
            cantidad: cantidadItems,
            porcentaje: parseFloat(porcentaje)
        });
    }

    // Ordenar de mayor a menor valor
    resultado.sort((a, b) => b.total - a.total);

    return resultado;
}

/* ==============================================================================
   6. RENDERIZADO DEL DASHBOARD, ALERTAS Y CATEGORÍAS
   ============================================================================== */

/** Variable global para controlar el intervalo de aparición secuencial de alertas */
let timerAlertaUnoPorUno = null;

/**
 * Anima un contador numérico en un elemento del DOM (efecto dinámico de conteo).
 * @param {HTMLElement} elemento - Elemento objetivo
 * @param {number} valorFinal - Valor al que debe llegar
 * @param {boolean} esMoneda - Si debe formatearse en Soles (S/)
 * @param {number} duracion - Duración en milisegundos
 */
function animarContadorKPI(elemento, valorFinal, esMoneda = false, duracion = 750) {
    if (!elemento) return;

    // Si el usuario tiene activo prefers-reduced-motion, asignar directamente
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        elemento.textContent = esMoneda ? formatearSoles(valorFinal) : valorFinal.toLocaleString('es-PE');
        return;
    }

    // Leer el valor anterior almacenado en dataset, o iniciar desde 0
    let valorInicial = 0;
    if (elemento.dataset.valorActual !== undefined) {
        valorInicial = parseFloat(elemento.dataset.valorActual) || 0;
    }

    // Guardar el nuevo valor en dataset para futuros cambios
    elemento.dataset.valorActual = valorFinal;

    // Si la diferencia es nula o despreciable, pintar directamente
    if (Math.abs(valorFinal - valorInicial) < 0.001) {
        elemento.textContent = esMoneda ? formatearSoles(valorFinal) : valorFinal.toLocaleString('es-PE');
        return;
    }

    const fps = 60;
    const totalFrames = Math.max(Math.round((duracion / 1000) * fps), 15);
    let frameActual = 0;
    const diferencia = valorFinal - valorInicial;

    // Efecto sutil visual mientras cuenta
    elemento.classList.add('kpi-counter-updating');

    // requestAnimationFrame sincroniza cada actualización con el repintado del navegador.
    const tick = () => {
        frameActual++;
        const progreso = frameActual / totalFrames;
        // Curva easeOutCubic para una desaceleración suave y profesional
        const factorEase = 1 - Math.pow(1 - progreso, 3);
        const valorIntermedio = valorInicial + (diferencia * factorEase);

        if (esMoneda) {
            elemento.textContent = formatearSoles(valorIntermedio);
        } else {
            elemento.textContent = Math.round(valorIntermedio).toLocaleString('es-PE');
        }

        if (frameActual < totalFrames) {
            requestAnimationFrame(tick);
        } else {
            elemento.textContent = esMoneda ? formatearSoles(valorFinal) : valorFinal.toLocaleString('es-PE');
            elemento.classList.remove('kpi-counter-updating');
        }
    };

    requestAnimationFrame(tick);
}

/**
 * Crea el elemento chip/badge visual para un producto crítico en la alerta.
 * @param {Object} prod - Producto con stock crítico o agotado.
 * @returns {HTMLElement} Elemento DOM con diseño de badge interactivo.
 */
function crearChipAlertaProducto(prod) {
    const chip = document.createElement('div');
    chip.className = 'alerta-chip-item d-inline-flex align-items-center gap-2 px-2 py-1 bg-white border border-danger-subtle rounded-3 shadow-xs';

    // El contenido de texto del producto se escapa porque se inserta en una plantilla HTML.
    const esAgotado = prod.stock === 0;
    const badgeEstadoClase = esAgotado ? 'bg-secondary' : 'bg-danger';
    const badgeEstadoTexto = esAgotado ? 'Agotado (0 un.)' : `${prod.stock} un. (Mín: ${prod.stockMinimo})`;
    const icono = esAgotado ? 'bi-x-octagon-fill' : 'bi-exclamation-triangle-fill';

    chip.innerHTML = `
        <i class="bi ${icono} text-danger fs-xs" aria-hidden="true"></i>
        <span class="fw-bold text-navy fs-xs">${escapeHTML(prod.nombre)}</span>
        <span class="badge ${badgeEstadoClase} fs-xs py-1 px-2">${badgeEstadoTexto}</span>
        <span class="badge bg-light text-muted border fs-xs">${escapeHTML(prod.categoria)}</span>
    `;

    return chip;
}

/**
 * Muestra los productos con stock bajo en el banner de alerta uno por uno con animación secuencial.
 * @param {Array<Object>} productosCriticos - Lista de productos con stock bajo o agotados.
 */
function animarAlertaStockBajo(productosCriticos) {
    const bannerAlerta = document.getElementById('bannerAlertaStockBajo');
    const contenedorChips = document.getElementById('alertaListaNombres');
    const badgeContador = document.getElementById('alertaBadgeContador');

    if (!bannerAlerta || !contenedorChips) return;

    // Limpiar temporizador previo si existiera
    if (timerAlertaUnoPorUno) {
        clearInterval(timerAlertaUnoPorUno);
        timerAlertaUnoPorUno = null;
    }

    if (productosCriticos.length === 0) {
        bannerAlerta.classList.add('d-none');
        contenedorChips.innerHTML = '';
        if (badgeContador) badgeContador.textContent = '0 productos';
        return;
    }

    // Mostrar el banner de alerta y limpiar chips previos
    bannerAlerta.classList.remove('d-none');
    contenedorChips.innerHTML = '';

    if (badgeContador) {
        const plural = productosCriticos.length === 1 ? 'producto crítico' : 'productos críticos';
        badgeContador.textContent = `${productosCriticos.length} ${plural}`;
    }

    // Si el usuario prefiere reducción de movimiento, renderizar todos inmediatamente
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
        for (const prod of productosCriticos) {
            contenedorChips.appendChild(crearChipAlertaProducto(prod));
        }
        return;
    }

    // Insertar productos UNO POR UNO con retardo progresivo (280ms entre cada uno)
    let indice = 0;
    timerAlertaUnoPorUno = setInterval(() => {
        if (indice < productosCriticos.length) {
            const prod = productosCriticos[indice];
            const chipEl = crearChipAlertaProducto(prod);
            contenedorChips.appendChild(chipEl);
            indice++;
        } else {
            clearInterval(timerAlertaUnoPorUno);
            timerAlertaUnoPorUno = null;
        }
    }, 280);
}

/**
 * Actualiza las 4 tarjetas KPI dinámicamente, el banner de alerta (uno por uno) y el panel de categorías.
 */
function renderizarDashboard() {
    // El tablero siempre se deriva del arreglo actual, para mantener los datos sincronizados.
    const metricas = calcularMetricasInventario();

    // Actualizar Tarjetas KPI con contadores dinámicos animados
    const elTotalProductos = document.getElementById('kpiTotalProductos');
    const elTotalUnidades = document.getElementById('kpiTotalUnidades');
    const elValorTotal = document.getElementById('kpiValorTotal');
    const elStockBajo = document.getElementById('kpiStockBajo');

    animarContadorKPI(elTotalProductos, metricas.totalProductos, false);
    animarContadorKPI(elTotalUnidades, metricas.totalUnidades, false);
    animarContadorKPI(elValorTotal, metricas.valorTotal, true);
    animarContadorKPI(elStockBajo, metricas.totalStockBajo, false);

    // 2. Banner de Alerta de Stock Bajo (Aparición secuencial uno por uno)
    animarAlertaStockBajo(metricas.productosBajoStock);

    // 4. Panel Valor por Categoría
    renderizarProgresoCategorias(metricas.valorTotal);
}

/**
 * Renderiza las barras de progreso de Bootstrap para cada categoría.
 * @param {number} valorTotalGeneral - Valor total monetario del inventario.
 */
function renderizarProgresoCategorias(valorTotalGeneral) {
    const contenedor = document.getElementById('contenedorProgresoCategorias');
    if (!contenedor) return;

    const datosCategorias = calcularValorPorCategoria(valorTotalGeneral);
    let html = '';

    const coloresBarras = [
        'bg-primary',
        'bg-success',
        'bg-info text-dark',
        'bg-warning text-dark',
        'bg-secondary',
        'bg-dark'
    ];

    for (let i = 0; i < datosCategorias.length; i++) {
        const item = datosCategorias[i];
        const colorClase = coloresBarras[i % coloresBarras.length];

        html += `
            <div class="col-12 col-md-6 col-xl-4">
                <div class="category-progress-item">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="fw-bold small text-navy d-inline-flex align-items-center gap-2">
                            <i class="bi ${ICONOS_CATEGORIA[item.categoria] || 'bi-tag-fill'} text-primary" aria-hidden="true"></i>
                            ${escapeHTML(item.categoria)}
                        </span>
                        <span class="fs-xs fw-semibold text-muted">${item.cantidad} prod.</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-baseline mb-2">
                        <span class="fw-semibold text-dark fs-xs">${formatearSoles(item.total)}</span>
                        <span class="badge bg-light text-dark border fs-xs">${item.porcentaje}%</span>
                    </div>
                    <div class="progress" role="progressbar" aria-label="Porcentaje de ${escapeHTML(item.categoria)}" aria-valuenow="${item.porcentaje}" aria-valuemin="0" aria-valuemax="100">
                        <div class="progress-bar ${colorClase}" style="width: ${item.porcentaje}%"></div>
                    </div>
                </div>
            </div>
        `;
    }

    contenedor.innerHTML = html;
}

/* ==============================================================================
   7. FILTRADO, ORDENACIÓN Y PAGINACIÓN
   ============================================================================== */

/**
 * Aplica los filtros activos (búsqueda, categoría, estado y precio) sobre el array de productos.
 * @returns {Array<Object>} Lista de productos filtrados.
 */
function obtenerProductosFiltrados() {
    // Los filtros se combinan: un producto debe cumplir todos los criterios seleccionados.
    return productos.filter(prod => {
        // Filtro 1: Búsqueda por texto (nombre o código)
        if (filtros.busqueda.trim() !== '') {
            const termino = filtros.busqueda.toLowerCase().trim();
            const coincideNombre = prod.nombre.toLowerCase().includes(termino);
            const coincideCodigo = prod.codigo.toLowerCase().includes(termino);
            if (!coincideNombre && !coincideCodigo) {
                return false;
            }
        }

        // Filtro 2: Categoría
        if (filtros.categoria !== 'todas' && prod.categoria !== filtros.categoria) {
            return false;
        }

        // Filtro 3: Estado de existencia
        if (filtros.estado !== 'todos') {
            const estadoObj = obtenerEstadoProducto(prod.stock, prod.stockMinimo);
            if (estadoObj.clave !== filtros.estado) {
                return false;
            }
        }

        // Filtro 4: Rango de precio
        if (filtros.precioMin !== null && prod.precio < filtros.precioMin) {
            return false;
        }
        if (filtros.precioMax !== null && prod.precio > filtros.precioMax) {
            return false;
        }

        return true;
    });
}

/**
 * Ordena una lista de productos según el criterio seleccionado.
 * @param {Array<Object>} lista - Lista a ordenar.
 * @returns {Array<Object>} Lista ordenada.
 */
function ordenarProductos(lista) {
    // Se ordena una copia para no cambiar el orden del catálogo original.
    const copia = [...lista];

    switch (filtros.orden) {
        case 'nombre_asc':
            copia.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-PE'));
            break;
        case 'nombre_desc':
            copia.sort((a, b) => b.nombre.localeCompare(a.nombre, 'es-PE'));
            break;
        case 'precio_asc':
            copia.sort((a, b) => a.precio - b.precio);
            break;
        case 'precio_desc':
            copia.sort((a, b) => b.precio - a.precio);
            break;
        case 'stock_asc':
            copia.sort((a, b) => a.stock - b.stock);
            break;
        case 'stock_desc':
            copia.sort((a, b) => b.stock - a.stock);
            break;
        default:
            copia.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-PE'));
            break;
    }

    return copia;
}

/**
 * Renderiza la tabla de productos, contadores de filtros y controles de paginación.
 */
function renderizarTabla() {
    const tbody = document.getElementById('tbodyProductos');
    const estadoVacioInventario = document.getElementById('estadoVacioInventario');
    const estadoVacioFiltros = document.getElementById('estadoVacioFiltros');
    const contenedorPaginacion = document.getElementById('contenedorPaginacion');
    const contadorProductos = document.getElementById('contadorProductos');
    const tabla = document.getElementById('tablaProductos');

    if (!tbody) return;

    // Flujo de la tabla: filtrar, ordenar, resolver estados vacíos, paginar y dibujar filas.
    // 1. Obtener lista filtrada y ordenada
    const productosFiltrados = obtenerProductosFiltrados();
    const productosOrdenados = ordenarProductos(productosFiltrados);

    // Actualizar contador reactivo
    if (contadorProductos) {
        contadorProductos.textContent = `Mostrando ${productosFiltrados.length} de ${productos.length} productos`;
    }

    // 2. Comprobar estados vacíos
    if (productos.length === 0) {
        // Inventario totalmente vacío
        tbody.innerHTML = '';
        tabla.classList.add('d-none');
        contenedorPaginacion.classList.add('d-none');
        estadoVacioFiltros.classList.add('d-none');
        estadoVacioInventario.classList.remove('d-none');
        return;
    }

    if (productosFiltrados.length === 0) {
        // Hay productos en inventario pero ninguno coincide con los filtros
        tbody.innerHTML = '';
        tabla.classList.add('d-none');
        contenedorPaginacion.classList.add('d-none');
        estadoVacioInventario.classList.add('d-none');
        estadoVacioFiltros.classList.remove('d-none');
        return;
    }

    // Mostrar tabla y paginación
    tabla.classList.remove('d-none');
    contenedorPaginacion.classList.remove('d-none');
    estadoVacioInventario.classList.add('d-none');
    estadoVacioFiltros.classList.add('d-none');

    // 3. Paginación: Cálculos de índices
    const totalPaginas = Math.ceil(productosOrdenados.length / PRODUCTOS_POR_PAGINA) || 1;

    // Asegurar que la página actual esté en rango válido
    if (paginaActual > totalPaginas) {
        paginaActual = totalPaginas;
    }
    if (paginaActual < 1) {
        paginaActual = 1;
    }

    // slice recibe el índice inicial y final (sin incluir el final) de la página visible.
    const indiceInicio = (paginaActual - 1) * PRODUCTOS_POR_PAGINA;
    const indiceFin = indiceInicio + PRODUCTOS_POR_PAGINA;
    const productosPagina = productosOrdenados.slice(indiceInicio, indiceFin);

    // 4. Renderizar filas en el tbody
    let filasHTML = '';

    for (const prod of productosPagina) {
        const estado = obtenerEstadoProducto(prod.stock, prod.stockMinimo);

        // Clase especial para resaltar la fila según stock
        let claseFila = '';
        if (prod.stock === 0) {
            claseFila = 'table-row-out-of-stock';
        } else if (prod.stock <= prod.stockMinimo) {
            claseFila = 'table-row-low-stock';
        }

        filasHTML += `
            <tr class="${claseFila}">
                <td class="ps-3 ps-md-4 fw-semibold text-secondary font-monospace">${escapeHTML(prod.codigo)}</td>
                <td>
                    <div class="fw-bold text-navy">${escapeHTML(prod.nombre)}</div>
                </td>
                <td>
                    <span class="badge bg-light text-dark border d-inline-flex align-items-center gap-1">
                        <i class="bi ${ICONOS_CATEGORIA[prod.categoria] || 'bi-tag-fill'}" aria-hidden="true"></i>
                        ${escapeHTML(prod.categoria)}
                    </span>
                </td>
                <td class="text-end fw-semibold text-dark">${formatearSoles(prod.precio)}</td>
                <td class="text-center">
                    <span class="fw-bold ${prod.stock === 0 ? 'text-secondary' : (prod.stock <= prod.stockMinimo ? 'text-danger' : 'text-dark')}">
                        ${prod.stock}
                    </span>
                </td>
                <td class="text-center text-muted">${prod.stockMinimo}</td>
                <td class="text-center">
                    <span class="${estado.badgeClase}">${estado.etiqueta}</span>
                </td>
                <td class="text-end pe-3 pe-md-4">
                    <div class="btn-group btn-group-sm" role="group" aria-label="Acciones para ${escapeHTML(prod.nombre)}">
                        <button type="button" class="btn btn-outline-primary table-action-btn btn-accion-detalle" data-id="${prod.id}" title="Ver ficha técnica" aria-label="Ver detalle de ${escapeHTML(prod.nombre)}">
                            <i class="bi bi-eye" aria-hidden="true"></i>
                        </button>
                        <button type="button" class="btn btn-outline-info table-action-btn btn-accion-movimiento text-dark" data-id="${prod.id}" title="Registrar entrada o salida" aria-label="Registrar movimiento para ${escapeHTML(prod.nombre)}">
                            <i class="bi bi-arrow-left-right" aria-hidden="true"></i>
                        </button>
                        <button type="button" class="btn btn-outline-warning table-action-btn btn-accion-editar text-dark" data-id="${prod.id}" title="Modificar datos" aria-label="Editar ${escapeHTML(prod.nombre)}">
                            <i class="bi bi-pencil" aria-hidden="true"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger table-action-btn btn-accion-eliminar" data-id="${prod.id}" title="Eliminar producto" aria-label="Eliminar ${escapeHTML(prod.nombre)}">
                            <i class="bi bi-trash" aria-hidden="true"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    tbody.innerHTML = filasHTML;

    // 5. Renderizar controles de paginación
    renderizarPaginacion(totalPaginas);
}

/**
 * Renderiza los botones de página y el indicador numérico.
 * @param {number} totalPaginas - Total de páginas disponibles.
 */
function renderizarPaginacion(totalPaginas) {
    const listaPaginacion = document.getElementById('listaPaginacion');
    const infoPaginacion = document.getElementById('infoPaginacion');

    if (!listaPaginacion || !infoPaginacion) return;

    infoPaginacion.textContent = `Página ${paginaActual} de ${totalPaginas}`;

    let html = '';

    // Botón Anterior
    const deshabilitarAnterior = paginaActual === 1 ? 'disabled' : '';
    html += `
        <li class="page-item ${deshabilitarAnterior}">
            <button class="page-link" type="button" data-pagina="${paginaActual - 1}" aria-label="Página anterior">
                <span aria-hidden="true">&laquo;</span>
            </button>
        </li>
    `;

    // Se generan botones para cada página; data-pagina se usa en el listener delegado.
    // Botones con números de página
    for (let p = 1; p <= totalPaginas; p++) {
        const claseActiva = p === paginaActual ? 'active' : '';
        const ariaCurrent = p === paginaActual ? 'aria-current="page"' : '';
        html += `
            <li class="page-item ${claseActiva}">
                <button class="page-link" type="button" data-pagina="${p}" ${ariaCurrent}>${p}</button>
            </li>
        `;
    }

    // Botón Siguiente
    const deshabilitarSiguiente = paginaActual === totalPaginas ? 'disabled' : '';
    html += `
        <li class="page-item ${deshabilitarSiguiente}">
            <button class="page-link" type="button" data-pagina="${paginaActual + 1}" aria-label="Página siguiente">
                <span aria-hidden="true">&raquo;</span>
            </button>
        </li>
    `;

    listaPaginacion.innerHTML = html;
}

/* ==============================================================================
   8. VALIDACIÓN EN VIVO DE FORMULARIOS (IS-VALID / IS-INVALID)
   ============================================================================== */

/**
 * Valida un campo individual y aplica las clases correspondientes de Bootstrap.
 * @param {HTMLInputElement|HTMLSelectElement} input - Elemento a validar.
 * @param {boolean} esValido - Si pasa la validación.
 * @param {string} mensajeError - Mensaje a colocar en el invalid-feedback correspondiente.
 */
function aplicarValidacionCampo(input, esValido, mensajeError = '') {
    if (!input) return;

    if (esValido) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    } else {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');

        // Buscar el contenedor invalid-feedback hermano o asociado
        const feedback = input.parentElement.querySelector('.invalid-feedback') ||
                         input.closest('.col-12, .col-md-4, .col-md-6, .col-md-8, .mb-3')?.querySelector('.invalid-feedback');
        if (feedback && mensajeError) {
            feedback.textContent = mensajeError;
        }
    }
}

/**
 * Limpia las clases de validación de un formulario.
 * @param {HTMLFormElement} form - Formulario a limpiar.
 */
function limpiarValidacionesFormulario(form) {
    if (!form) return;
    const inputs = form.querySelectorAll('.form-control, .form-select');
    for (const input of inputs) {
        input.classList.remove('is-valid', 'is-invalid');
    }
}

/**
 * Valida los campos del formulario de Producto (crear/editar).
 * @param {string} idEditando - ID del producto si estamos en modo edición, o vacío si es nuevo.
 * @returns {boolean} True si todos los campos son válidos.
 */
function validarFormularioProducto(idEditando = '') {
    const inputCodigo = document.getElementById('inputCodigo');
    const inputNombre = document.getElementById('inputNombre');
    const inputCategoria = document.getElementById('inputCategoria');
    const inputPrecio = document.getElementById('inputPrecio');
    const inputStock = document.getElementById('inputStock');
    const inputStockMinimo = document.getElementById('inputStockMinimo');

    // La validación no se detiene en el primer error: marca todos los campos incorrectos.
    let formularioValido = true;

    // 1. Validar Código (obligatorio, mínimo 3 caracteres y único)
    const valCodigo = inputCodigo.value.trim().toUpperCase();
    if (valCodigo.length < 3) {
        aplicarValidacionCampo(inputCodigo, false, 'El código debe tener al menos 3 caracteres.');
        formularioValido = false;
    } else {
        // Verificar si el código ya existe en otro producto (insensible a mayúsculas)
        const existeCodigo = productos.some(p => p.codigo.toUpperCase() === valCodigo && p.id !== idEditando);
        if (existeCodigo) {
            aplicarValidacionCampo(inputCodigo, false, 'Este código ya está registrado en otro producto.');
            formularioValido = false;
        } else {
            aplicarValidacionCampo(inputCodigo, true);
        }
    }

    // 2. Validar Nombre (obligatorio, mínimo 3 caracteres)
    const valNombre = inputNombre.value.trim();
    if (valNombre.length < 3) {
        aplicarValidacionCampo(inputNombre, false, 'El nombre es obligatorio (mínimo 3 caracteres).');
        formularioValido = false;
    } else {
        aplicarValidacionCampo(inputNombre, true);
    }

    // 3. Validar Categoría
    const valCategoria = inputCategoria.value;
    if (!valCategoria || !CATEGORIAS_VALIDAS.includes(valCategoria)) {
        aplicarValidacionCampo(inputCategoria, false, 'Seleccione una categoría válida de la lista.');
        formularioValido = false;
    } else {
        aplicarValidacionCampo(inputCategoria, true);
    }

    // 4. Validar Precio (obligatorio, float > 0)
    const valPrecio = parseFloat(inputPrecio.value);
    if (isNaN(valPrecio) || valPrecio <= 0) {
        aplicarValidacionCampo(inputPrecio, false, 'El precio debe ser un número mayor a 0.00.');
        formularioValido = false;
    } else {
        aplicarValidacionCampo(inputPrecio, true);
    }

    // 5. Validar Stock (obligatorio, entero >= 0)
    const valStock = parseInt(inputStock.value, 10);
    if (isNaN(valStock) || valStock < 0 || inputStock.value.trim() === '') {
        aplicarValidacionCampo(inputStock, false, 'El stock debe ser un entero mayor o igual a 0.');
        formularioValido = false;
    } else {
        aplicarValidacionCampo(inputStock, true);
    }

    // 6. Validar Stock Mínimo (obligatorio, entero >= 0)
    const valStockMin = parseInt(inputStockMinimo.value, 10);
    if (isNaN(valStockMin) || valStockMin < 0 || inputStockMinimo.value.trim() === '') {
        aplicarValidacionCampo(inputStockMinimo, false, 'El stock mínimo debe ser un entero mayor o igual a 0.');
        formularioValido = false;
    } else {
        aplicarValidacionCampo(inputStockMinimo, true);
    }

    return formularioValido;
}

/* ==============================================================================
   9. OPERACIONES CRUD (CREAR, EDITAR, ELIMINAR Y MOVIMIENTO DE STOCK)
   ============================================================================== */

/**
 * Abre el modal para crear un nuevo producto.
 * @param {HTMLElement} triggerBtn - Botón que disparó la apertura para accesibilidad de foco.
 */
function abrirModalNuevoProducto(triggerBtn = null) {
    ultimoElementoFoco = triggerBtn;

    const form = document.getElementById('formProducto');
    form.reset();
    limpiarValidacionesFormulario(form);

    document.getElementById('productoIdOculto').value = '';
    document.getElementById('textoTituloModalProducto').textContent = 'Nuevo Producto';
    document.getElementById('textoBotonGuardar').textContent = 'Guardar producto';

    if (bsModalProducto) {
        bsModalProducto.show();
    }
}

/**
 * Abre el modal para editar un producto existente y precarga sus datos.
 * @param {string} id - ID del producto a editar.
 * @param {HTMLElement} triggerBtn - Elemento que disparó la acción.
 */
function abrirModalEditarProducto(id, triggerBtn = null) {
    ultimoElementoFoco = triggerBtn;

    const prod = productos.find(p => p.id === id);
    if (!prod) {
        mostrarToast('Producto no encontrado', 'danger');
        return;
    }

    const form = document.getElementById('formProducto');
    form.reset();
    limpiarValidacionesFormulario(form);

    document.getElementById('productoIdOculto').value = prod.id;
    document.getElementById('inputCodigo').value = prod.codigo;
    document.getElementById('inputNombre').value = prod.nombre;
    document.getElementById('inputCategoria').value = prod.categoria;
    document.getElementById('inputPrecio').value = prod.precio.toFixed(2);
    document.getElementById('inputStock').value = prod.stock;
    document.getElementById('inputStockMinimo').value = prod.stockMinimo;

    document.getElementById('textoTituloModalProducto').textContent = 'Editar Producto';
    document.getElementById('textoBotonGuardar').textContent = 'Guardar cambios';

    if (bsModalProducto) {
        bsModalProducto.show();
    }
}

/**
 * Procesa el envío del formulario de producto (creación o modificación).
 * @param {Event} event
 */
function manejarGuardarProducto(event) {
    event.preventDefault();

    // El ID oculto distingue si el formulario está creando un producto o editándolo.
    const idEditando = document.getElementById('productoIdOculto').value.trim();
    const esValido = validarFormularioProducto(idEditando);

    if (!esValido) {
        return;
    }

    const codigo = document.getElementById('inputCodigo').value.trim().toUpperCase();
    const nombre = document.getElementById('inputNombre').value.trim();
    const categoria = document.getElementById('inputCategoria').value;
    const precio = parseFloat(document.getElementById('inputPrecio').value);
    const stock = parseInt(document.getElementById('inputStock').value, 10);
    const stockMinimo = parseInt(document.getElementById('inputStockMinimo').value, 10);

    if (idEditando) {
        // Modo Edición: Actualizar objeto existente
        const index = productos.findIndex(p => p.id === idEditando);
        if (index !== -1) {
            productos[index].codigo = codigo;
            productos[index].nombre = nombre;
            productos[index].categoria = categoria;
            productos[index].precio = precio;
            productos[index].stock = stock;
            productos[index].stockMinimo = stockMinimo;

            // Después de cambiar los datos, se persisten y se actualizan todas las vistas.
            guardarProductosEnStorage();
            renderizarDashboard();
            renderizarTabla();
            bsModalProducto.hide();
            mostrarToast('Cambios guardados con éxito', 'success');
        }
    } else {
        // Modo Creación: Generar nuevo ID y agregar
        const nuevoProducto = {
            id: 'prod_' + Date.now(),
            codigo,
            nombre,
            categoria,
            precio,
            stock,
            stockMinimo,
            fechaCreacion: new Date().toISOString().split('T')[0]
        };

        productos.unshift(nuevoProducto); // Agregar al inicio de la lista
        guardarProductosEnStorage();
        renderizarDashboard();
        renderizarTabla();
        bsModalProducto.hide();
        mostrarToast('Producto registrado con éxito', 'success');
    }
}

/**
 * Abre el modal de movimiento de stock (Entrada o Salida).
 * @param {string} id - ID del producto.
 * @param {HTMLElement} triggerBtn - Elemento que disparó la acción.
 */
function abrirModalMovimiento(id, triggerBtn = null) {
    ultimoElementoFoco = triggerBtn;

    const prod = productos.find(p => p.id === id);
    if (!prod) return;

    const form = document.getElementById('formMovimiento');
    form.reset();
    limpiarValidacionesFormulario(form);

    document.getElementById('movimientoProductoId').value = prod.id;
    document.getElementById('movimientoProductoNombre').textContent = prod.nombre;
    document.getElementById('movimientoProductoCodigo').textContent = prod.codigo;
    document.getElementById('movimientoProductoStock').textContent = `${prod.stock} unidades`;

    // Por defecto marcar "Entrada"
    document.getElementById('tipoEntrada').checked = true;

    if (bsModalMovimiento) {
        bsModalMovimiento.show();
    }
}

/**
 * Procesa el registro de movimiento de stock.
 * @param {Event} event
 */
function manejarGuardarMovimiento(event) {
    event.preventDefault();

    const id = document.getElementById('movimientoProductoId').value;
    const inputCantidad = document.getElementById('inputCantidadMovimiento');
    const feedbackCantidad = document.getElementById('feedbackCantidadMovimiento');
    const motivo = document.getElementById('inputMotivoMovimiento').value.trim();

    const prod = productos.find(p => p.id === id);
    if (!prod) return;

    const tipo = document.querySelector('input[name="tipoMovimiento"]:checked')?.value || 'entrada';
    const cantidad = parseInt(inputCantidad.value, 10);

    // Las entradas y salidas siempre requieren una cantidad entera positiva.
    // Validación de cantidad
    if (isNaN(cantidad) || cantidad <= 0) {
        aplicarValidacionCampo(inputCantidad, false, 'La cantidad debe ser un entero mayor a 0.');
        return;
    }

    // Validación para salidas: no permitir que supere el stock actual
    if (tipo === 'salida' && cantidad > prod.stock) {
        aplicarValidacionCampo(
            inputCantidad,
            false,
            `Stock insuficiente. No puede retirar ${cantidad} unidades cuando solo hay ${prod.stock} disponibles.`
        );
        return;
    }

    // Una entrada suma unidades y una salida las resta del inventario disponible.
    // La comprobación previa impide que el stock termine siendo negativo.
    if (tipo === 'entrada') {
        prod.stock += cantidad;
    } else {
        prod.stock -= cantidad;
    }

    guardarProductosEnStorage();
    renderizarDashboard();
    renderizarTabla();
    bsModalMovimiento.hide();

    const verboAccion = tipo === 'entrada' ? 'Entrada registrada' : 'Salida registrada';
    const detalleMotivo = motivo ? ` (${motivo})` : '';
    mostrarToast(`${verboAccion}: ${cantidad} unid. a "${prod.nombre}"${detalleMotivo}`, 'success');
}

/**
 * Abre el modal con la ficha técnica detallada del producto.
 * @param {string} id - ID del producto.
 * @param {HTMLElement} triggerBtn - Elemento que disparó la acción.
 */
function abrirModalDetalle(id, triggerBtn = null) {
    ultimoElementoFoco = triggerBtn;

    const prod = productos.find(p => p.id === id);
    if (!prod) return;

    // El detalle reutiliza las mismas reglas de estado y formato que el resto de la interfaz.
    const estado = obtenerEstadoProducto(prod.stock, prod.stockMinimo);
    const valorEnStock = prod.stock * prod.precio;

    const cuerpoDetalle = document.getElementById('cuerpoDetalleProducto');
    cuerpoDetalle.innerHTML = `
        <div class="text-center pb-3 border-bottom mb-3">
            <span class="fs-xs font-monospace text-muted text-uppercase">${escapeHTML(prod.codigo)}</span>
            <h4 class="h5 fw-bold text-navy mb-1">${escapeHTML(prod.nombre)}</h4>
            <span class="${estado.badgeClase} fs-6">${estado.etiqueta}</span>
        </div>

        <div class="row g-3">
            <div class="col-6">
                <span class="fs-xs text-uppercase text-muted d-block">Categoría</span>
                <span class="fw-semibold text-dark">${escapeHTML(prod.categoria)}</span>
            </div>
            <div class="col-6">
                <span class="fs-xs text-uppercase text-muted d-block">Precio Unitario</span>
                <span class="fw-bold text-dark fs-5">${formatearSoles(prod.precio)}</span>
            </div>
            <div class="col-6">
                <span class="fs-xs text-uppercase text-muted d-block">Stock Actual</span>
                <span class="fw-bold fs-5 ${prod.stock === 0 ? 'text-secondary' : (prod.stock <= prod.stockMinimo ? 'text-danger' : 'text-success')}">
                    ${prod.stock} unid.
                </span>
            </div>
            <div class="col-6">
                <span class="fs-xs text-uppercase text-muted d-block">Stock Mínimo Alerta</span>
                <span class="fw-semibold text-muted">${prod.stockMinimo} unid.</span>
            </div>
            <div class="col-12">
                <div class="p-3 bg-light rounded-3 border">
                    <span class="fs-xs text-uppercase text-muted d-block">Valor Total en Almacén</span>
                    <strong class="text-navy fs-4">${formatearSoles(valorEnStock)}</strong>
                    <div class="fs-xs text-muted mt-1">Cálculo: ${prod.stock} unidades x ${formatearSoles(prod.precio)}</div>
                </div>
            </div>
        </div>

        ${prod.stock <= prod.stockMinimo ? `
            <div class="alert alert-danger d-flex align-items-center gap-2 mt-3 mb-0 py-2 fs-xs">
                <i class="bi bi-exclamation-triangle-fill fs-5" aria-hidden="true"></i>
                <span><strong>Acción recomendada:</strong> Contactar a proveedor para reponer existencias.</span>
            </div>
        ` : ''}
    `;

    if (bsModalDetalle) {
        bsModalDetalle.show();
    }
}

/**
 * Abre el modal de confirmación para eliminar un producto.
 * @param {string} id - ID del producto.
 * @param {HTMLElement} triggerBtn - Elemento que disparó la acción.
 */
function abrirModalEliminar(id, triggerBtn = null) {
    ultimoElementoFoco = triggerBtn;

    const prod = productos.find(p => p.id === id);
    if (!prod) return;

    productoEliminarId = prod.id;
    document.getElementById('nombreProductoEliminar').textContent = `"${prod.nombre}"`;
    document.getElementById('codigoProductoEliminar').textContent = `Código: ${prod.codigo} | Categoría: ${prod.categoria}`;

    if (bsModalEliminar) {
        bsModalEliminar.show();
    }
}

/**
 * Confirma y ejecuta la eliminación del producto seleccionado.
 */
function ejecutarEliminarProducto() {
    if (!productoEliminarId) return;

    const index = productos.findIndex(p => p.id === productoEliminarId);
    if (index !== -1) {
        const nombreEliminado = productos[index].nombre;
        productos.splice(index, 1); // Quita del arreglo el producto localizado por su índice.

        guardarProductosEnStorage();
        renderizarDashboard();
        renderizarTabla();
        bsModalEliminar.hide();
        productoEliminarId = null;

        mostrarToast(`Producto eliminado con éxito: "${nombreEliminado}"`, 'danger');
    }
}

/* ==============================================================================
   10. MODAL GENÉRICO DE CONFIRMACIÓN (VACIAR / RESTABLECER)
   ============================================================================== */

/**
 * Abre el modal genérico de confirmación con textos y estilos personalizados.
 * @param {string} titulo - Título del modal.
 * @param {string} mensaje - Mensaje explicativo.
 * @param {'danger' | 'warning'} tipoColor - Estilo de cabecera y botón.
 * @param {Function} callbackAccion - Acción a ejecutar al confirmar.
 * @param {HTMLElement} triggerBtn - Elemento que disparó la acción.
 */
function abrirModalConfirmarAccion(titulo, mensaje, tipoColor, callbackAccion, triggerBtn = null) {
    ultimoElementoFoco = triggerBtn;
    // Se guarda la acción para ejecutarla solo si el usuario confirma en el modal.
    callbackConfirmacionAccion = callbackAccion;

    const header = document.getElementById('modalConfirmarAccionHeader');
    const btnEjecutar = document.getElementById('btnEjecutarConfirmarAccion');
    const tituloEl = document.getElementById('textoTituloConfirmarAccion');
    const mensajeEl = document.getElementById('textoMensajeConfirmarAccion');

    tituloEl.textContent = titulo;
    mensajeEl.textContent = mensaje;

    header.className = `modal-header text-white bg-${tipoColor}`;
    btnEjecutar.className = `btn btn-${tipoColor} btn-sm`;
    btnEjecutar.textContent = 'Confirmar';

    if (bsModalConfirmarAccion) {
        bsModalConfirmarAccion.show();
    }
}

/**
 * Restablece los datos de prueba iniciales (12 productos).
 */
function restablecerDatosIniciales() {
    abrirModalConfirmarAccion(
        'Restablecer Datos de Ejemplo',
        '¿Desea restablecer el catálogo con los 12 productos de prueba iniciales? Se reemplazarán los datos actuales.',
        'warning',
        () => {
            // La operación está dentro del callback: no se realiza hasta confirmar el modal.
            productos = JSON.parse(JSON.stringify(PRODUCTOS_INICIALES));
            guardarProductosEnStorage();
            filtros.busqueda = '';
            filtros.categoria = 'todas';
            filtros.estado = 'todos';
            filtros.precioMin = null;
            filtros.precioMax = null;
            filtros.orden = 'nombre_asc';
            sincronizarControlesFiltro();
            paginaActual = 1;
            renderizarDashboard();
            renderizarTabla();
            bsModalConfirmarAccion.hide();
            mostrarToast('Datos de ejemplo restablecidos', 'success');
        }
    );
}

/**
 * Vacía completamente el inventario.
 */
function vaciarInventarioCompleto() {
    abrirModalConfirmarAccion(
        'Vaciar Todo el Inventario',
        '¿Está seguro de vaciar todo el inventario? Se eliminarán todos los productos registrados permanentemente.',
        'danger',
        () => {
            productos = [];
            guardarProductosEnStorage();
            paginaActual = 1;
            renderizarDashboard();
            renderizarTabla();
            bsModalConfirmarAccion.hide();
            mostrarToast('Inventario vaciado con éxito', 'danger');
        }
    );
}

/* ==============================================================================
   11. MODAL DE RESUMEN DEL INVENTARIO
   ============================================================================== */

/**
 * Genera y muestra el informe consolidado del inventario.
 * @param {HTMLElement} triggerBtn - Elemento que disparó la acción.
 */
function abrirModalResumen(triggerBtn = null) {
    ultimoElementoFoco = triggerBtn;
    // El contenido del informe se calcula con el estado actual, no con valores almacenados aparte.
    const metricas = calcularMetricasInventario();
    const desgloseCategorias = calcularValorPorCategoria(metricas.valorTotal);
    const cuerpo = document.getElementById('cuerpoModalResumen');

    let categoriasHTML = '';
    for (const cat of desgloseCategorias) {
        categoriasHTML += `
            <tr>
                <td class="fw-semibold">${escapeHTML(cat.categoria)}</td>
                <td class="text-center">${cat.cantidad}</td>
                <td class="text-end fw-bold">${formatearSoles(cat.total)}</td>
                <td class="text-end text-muted">${cat.porcentaje}%</td>
            </tr>
        `;
    }

    let criticosHTML = '';
    if (metricas.productosBajoStock.length > 0) {
        criticosHTML = `
            <h4 class="h6 fw-bold text-danger mb-2 mt-4">
                <i class="bi bi-exclamation-triangle-fill me-1" aria-hidden="true"></i>
                Productos que requieren reposición (${metricas.productosBajoStock.length})
            </h4>
            <div class="table-responsive">
                <table class="table table-sm table-bordered align-middle fs-xs mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Código</th>
                            <th>Producto</th>
                            <th class="text-center">Stock Actual</th>
                            <th class="text-center">Stock Mínimo</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${metricas.productosBajoStock.map(p => `
                            <tr>
                                <td class="font-monospace">${escapeHTML(p.codigo)}</td>
                                <td class="fw-bold">${escapeHTML(p.nombre)}</td>
                                <td class="text-center fw-bold text-danger">${p.stock}</td>
                                <td class="text-center">${p.stockMinimo}</td>
                                <td>${p.stock === 0 ? '<span class="badge bg-secondary">Agotado</span>' : '<span class="badge bg-danger">Stock bajo</span>'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else {
        criticosHTML = `
            <div class="alert alert-success py-2 px-3 mt-4 mb-0 small d-flex align-items-center gap-2">
                <i class="bi bi-check-circle-fill fs-5" aria-hidden="true"></i>
                <span>Todos los productos cuentan con niveles de stock óptimos.</span>
            </div>
        `;
    }

    cuerpo.innerHTML = `
        <div class="row g-3 mb-3 text-center">
            <div class="col-4">
                <div class="p-2 bg-light rounded-3 border">
                    <span class="fs-xs text-muted text-uppercase d-block">Productos</span>
                    <strong class="fs-5 text-navy">${metricas.totalProductos}</strong>
                </div>
            </div>
            <div class="col-4">
                <div class="p-2 bg-light rounded-3 border">
                    <span class="fs-xs text-muted text-uppercase d-block">Unidades</span>
                    <strong class="fs-5 text-navy">${metricas.totalUnidades}</strong>
                </div>
            </div>
            <div class="col-4">
                <div class="p-2 bg-light rounded-3 border">
                    <span class="fs-xs text-muted text-uppercase d-block">Valor Total</span>
                    <strong class="fs-5 text-navy">${formatearSoles(metricas.valorTotal)}</strong>
                </div>
            </div>
        </div>

        <h4 class="h6 fw-bold text-navy mb-2">Desglose por Categoría</h4>
        <div class="table-responsive">
            <table class="table table-sm table-striped align-middle fs-xs mb-0">
                <thead class="table-dark">
                    <tr>
                        <th>Categoría</th>
                        <th class="text-center">Variedad</th>
                        <th class="text-end">Valor Total (S/)</th>
                        <th class="text-end">Participación</th>
                    </tr>
                </thead>
                <tbody>
                    ${categoriasHTML}
                </tbody>
            </table>
        </div>

        ${criticosHTML}
    `;

    if (bsModalResumen) {
        bsModalResumen.show();
    }
}

/* ==============================================================================
   12. EXPORTACIÓN DE DATOS (CSV Y JSON DESCARGABLES)
   ============================================================================== */

/**
 * Exporta el inventario completo a un archivo CSV compatible con Excel.
 */
function exportarInventarioCSV() {
    if (productos.length === 0) {
        mostrarToast('No hay datos en el inventario para exportar', 'warning');
        return;
    }

    const encabezados = ['ID', 'Código', 'Nombre del Producto', 'Categoría', 'Precio (S/)', 'Stock Actual', 'Stock Mínimo', 'Valor Total (S/)', 'Estado'];
    const filas = [];

    // Se usa punto y coma como separador, habitual en hojas de cálculo con configuración regional.
    filas.push(encabezados.join(';'));

    for (const prod of productos) {
        const estado = obtenerEstadoProducto(prod.stock, prod.stockMinimo);
        const valorTotal = (prod.stock * prod.precio).toFixed(2);
        
        // Limpiar comas y comillas para CSV
        const nombreLimpio = `"${prod.nombre.replace(/"/g, '""')}"`;
        const categoriaLimpia = `"${prod.categoria}"`;

        const fila = [
            prod.id,
            prod.codigo,
            nombreLimpio,
            categoriaLimpia,
            prod.precio.toFixed(2),
            prod.stock,
            prod.stockMinimo,
            valorTotal,
            `"${estado.etiqueta}"`
        ];

        filas.push(fila.join(';'));
    }

    // Agregar UTF-8 BOM (\uFEFF) para que Excel abra correctamente los acentos y símbolos
    const csvContent = '\uFEFF' + filas.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const fechaHoy = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.href = url;
    link.download = `stockpro_inventario_${fechaHoy}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    mostrarToast('Inventario exportado a CSV con éxito', 'success');
}

/**
 * Exporta el inventario completo a un archivo JSON estructurado.
 */
function exportarInventarioJSON() {
    if (productos.length === 0) {
        mostrarToast('No hay datos en el inventario para exportar', 'warning');
        return;
    }

    // El archivo incluye metadatos de exportación además del arreglo completo de productos.
    const datosExportacion = {
        sistema: 'StockPro - Sistema de Inventario',
        instituto: 'Instituto IDAT - Desarrollo de Interfaces I',
        fechaExportacion: new Date().toISOString(),
        totalProductos: productos.length,
        inventario: productos
    };

    const jsonString = JSON.stringify(datosExportacion, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const fechaHoy = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.href = url;
    link.download = `stockpro_inventario_${fechaHoy}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    mostrarToast('Inventario exportado a JSON con éxito', 'success');
}

/* ==============================================================================
   13. SINCRONIZACIÓN DE INTERFAZ Y MANEJADORES DE EVENTOS
   ============================================================================== */

/**
 * Sincroniza los controles de formulario de filtros con el objeto de filtros.
 */
function sincronizarControlesFiltro() {
    const inputBusqueda = document.getElementById('inputBusqueda');
    const selectCategoria = document.getElementById('selectCategoria');
    const selectOrden = document.getElementById('selectOrden');
    const inputPrecioMin = document.getElementById('inputPrecioMin');
    const inputPrecioMax = document.getElementById('inputPrecioMax');

    if (inputBusqueda) inputBusqueda.value = filtros.busqueda;
    if (selectCategoria) selectCategoria.value = filtros.categoria;
    if (selectOrden) selectOrden.value = filtros.orden;
    if (inputPrecioMin) inputPrecioMin.value = filtros.precioMin !== null ? filtros.precioMin : '';
    if (inputPrecioMax) inputPrecioMax.value = filtros.precioMax !== null ? filtros.precioMax : '';

    // Los radios se sincronizan aparte porque comparten nombre y se seleccionan por valor.
    // Seleccionar radio de estado
    const radioEstado = document.querySelector(`input[name="filtroEstado"][value="${filtros.estado}"]`);
    if (radioEstado) radioEstado.checked = true;
}

/**
 * Restablece todos los filtros aplicados a sus valores iniciales.
 */
function limpiarTodosLosFiltros() {
    // Restablece tanto los valores internos como los controles visibles del formulario.
    filtros.busqueda = '';
    filtros.categoria = 'todas';
    filtros.estado = 'todos';
    filtros.precioMin = null;
    filtros.precioMax = null;
    filtros.orden = 'nombre_asc';

    sincronizarControlesFiltro();
    paginaActual = 1;
    renderizarTabla();
    mostrarToast('Filtros restablecidos', 'info');
}

/**
 * Inicializa todos los eventos de interacción de la página.
 */
function registrarEventos() {

    // Los listeners se registran una sola vez; la tabla se vuelve a dibujar al cambiar filtros.
    // --- Búsqueda en tiempo real con input ---
    const inputBusqueda = document.getElementById('inputBusqueda');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', (e) => {
            filtros.busqueda = e.target.value;
            paginaActual = 1;
            renderizarTabla();
        });
    }

    // Botón para limpiar campo de búsqueda
    const btnLimpiarBusqueda = document.getElementById('btnLimpiarBusqueda');
    if (btnLimpiarBusqueda && inputBusqueda) {
        btnLimpiarBusqueda.addEventListener('click', () => {
            inputBusqueda.value = '';
            filtros.busqueda = '';
            paginaActual = 1;
            renderizarTabla();
            inputBusqueda.focus();
        });
    }

    // --- Filtro por Categoría ---
    const selectCategoria = document.getElementById('selectCategoria');
    if (selectCategoria) {
        selectCategoria.addEventListener('change', (e) => {
            filtros.categoria = e.target.value;
            paginaActual = 1;
            renderizarTabla();
        });
    }

    // --- Filtro por Estado (btn-group) ---
    const radiosEstado = document.querySelectorAll('input[name="filtroEstado"]');
    radiosEstado.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                filtros.estado = e.target.value;
                paginaActual = 1;
                renderizarTabla();
            }
        });
    });

    // --- Ordenar por ---
    const selectOrden = document.getElementById('selectOrden');
    if (selectOrden) {
        selectOrden.addEventListener('change', (e) => {
            filtros.orden = e.target.value;
            renderizarTabla();
        });
    }

    // --- Botón "Limpiar filtros" general ---
    const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');
    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.addEventListener('click', limpiarTodosLosFiltros);
    }

    const btnRestablecerFiltrosVacio = document.getElementById('btnRestablecerFiltrosVacio');
    if (btnRestablecerFiltrosVacio) {
        btnRestablecerFiltrosVacio.addEventListener('click', limpiarTodosLosFiltros);
    }

    // --- Banner Alerta: Botón "Ver solo stock bajo" ---
    const btnVerSoloStockBajo = document.getElementById('btnVerSoloStockBajo');
    if (btnVerSoloStockBajo) {
        btnVerSoloStockBajo.addEventListener('click', () => {
            filtros.estado = 'stock_bajo';
            sincronizarControlesFiltro();
            paginaActual = 1;
            renderizarTabla();

            // Desplazar la vista a la tabla suavemente
            document.getElementById('tablaProductos')?.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // --- Offcanvas: Filtro por rango de precio ---
    const formFiltroPrecio = document.getElementById('formFiltroPrecio');
    if (formFiltroPrecio) {
        formFiltroPrecio.addEventListener('submit', (e) => {
            e.preventDefault();
            const minVal = parseFloat(document.getElementById('inputPrecioMin').value);
            const maxVal = parseFloat(document.getElementById('inputPrecioMax').value);
            const inputMax = document.getElementById('inputPrecioMax');

            // Validar que min <= max si ambos están presentes
            if (!isNaN(minVal) && !isNaN(maxVal) && minVal > maxVal) {
                inputMax.classList.add('is-invalid');
                return;
            } else {
                inputMax.classList.remove('is-invalid');
            }

            filtros.precioMin = !isNaN(minVal) ? minVal : null;
            filtros.precioMax = !isNaN(maxVal) ? maxVal : null;
            paginaActual = 1;
            renderizarTabla();

            if (bsOffcanvasFiltros) {
                bsOffcanvasFiltros.hide();
            }
            mostrarToast('Filtro de precio aplicado', 'info');
        });
    }

    // Restablecer rango de precio en offcanvas
    const btnRestablecerPrecioOffcanvas = document.getElementById('btnRestablecerPrecioOffcanvas');
    if (btnRestablecerPrecioOffcanvas) {
        btnRestablecerPrecioOffcanvas.addEventListener('click', () => {
            document.getElementById('inputPrecioMin').value = '';
            document.getElementById('inputPrecioMax').value = '';
            document.getElementById('inputPrecioMax').classList.remove('is-invalid');
            filtros.precioMin = null;
            filtros.precioMax = null;
            paginaActual = 1;
            renderizarTabla();
        });
    }

    // La delegación permite que las acciones sigan funcionando aunque renderizarTabla
    // reemplace las filas: el listener permanece en el tbody, que no se vuelve a crear.
    // --- DELEGACIÓN DE EVENTOS EN LA TABLA (TBODY) ---
    const tbody = document.getElementById('tbodyProductos');
    if (tbody) {
        tbody.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const id = btn.dataset.id;
            if (!id) return;

            if (btn.classList.contains('btn-accion-detalle')) {
                abrirModalDetalle(id, btn);
            } else if (btn.classList.contains('btn-accion-movimiento')) {
                abrirModalMovimiento(id, btn);
            } else if (btn.classList.contains('btn-accion-editar')) {
                abrirModalEditarProducto(id, btn);
            } else if (btn.classList.contains('btn-accion-eliminar')) {
                abrirModalEliminar(id, btn);
            }
        });
    }

    // La paginación también se vuelve a dibujar; por eso los clics se escuchan en su contenedor.
    // --- DELEGACIÓN DE EVENTOS EN PAGINACIÓN ---
    const listaPaginacion = document.getElementById('listaPaginacion');
    if (listaPaginacion) {
        listaPaginacion.addEventListener('click', (e) => {
            const boton = e.target.closest('button.page-link');
            if (!boton || boton.parentElement.classList.contains('disabled')) return;

            const nuevaPagina = parseInt(boton.dataset.pagina, 10);
            if (!isNaN(nuevaPagina) && nuevaPagina !== paginaActual) {
                paginaActual = nuevaPagina;
                renderizarTabla();
                document.getElementById('tablaProductos')?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // --- Formulario Producto (Guardar / Editar) ---
    const formProducto = document.getElementById('formProducto');
    if (formProducto) {
        formProducto.addEventListener('submit', manejarGuardarProducto);

        // Validación en tiempo real al escribir o cambiar
        const inputsValidar = formProducto.querySelectorAll('input, select');
        inputsValidar.forEach(input => {
            input.addEventListener('input', () => {
                const idEditando = document.getElementById('productoIdOculto').value.trim();
                validarFormularioProducto(idEditando);
            });
            input.addEventListener('blur', () => {
                const idEditando = document.getElementById('productoIdOculto').value.trim();
                validarFormularioProducto(idEditando);
            });
        });
    }

    // --- Formulario Movimiento de Stock ---
    const formMovimiento = document.getElementById('formMovimiento');
    if (formMovimiento) {
        formMovimiento.addEventListener('submit', manejarGuardarMovimiento);

        const inputCantidad = document.getElementById('inputCantidadMovimiento');
        if (inputCantidad) {
            inputCantidad.addEventListener('input', () => {
                inputCantidad.classList.remove('is-invalid', 'is-valid');
            });
        }
    }

    // --- Botón Confirmar Eliminación ---
    const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.addEventListener('click', ejecutarEliminarProducto);
    }

    // --- Botón Confirmar Acción Genérica (Vaciar / Restablecer) ---
    const btnEjecutarConfirmarAccion = document.getElementById('btnEjecutarConfirmarAccion');
    if (btnEjecutarConfirmarAccion) {
        btnEjecutarConfirmarAccion.addEventListener('click', () => {
            if (typeof callbackConfirmacionAccion === 'function') {
                callbackConfirmacionAccion();
            }
        });
    }

    // --- Acciones de la Navbar y Menú Herramientas ---
    const btnAbrirModalNuevo = document.getElementById('btnAbrirModalNuevo');
    if (btnAbrirModalNuevo) {
        btnAbrirModalNuevo.addEventListener('click', (e) => {
            abrirModalNuevoProducto(e.currentTarget);
        });
    }

    const btnAbrirResumen = document.getElementById('btnAbrirResumen');
    if (btnAbrirResumen) {
        btnAbrirResumen.addEventListener('click', (e) => {
            abrirModalResumen(e.currentTarget);
        });
    }

    const btnExportarCSV = document.getElementById('btnExportarCSV');
    if (btnExportarCSV) {
        btnExportarCSV.addEventListener('click', exportarInventarioCSV);
    }

    const btnExportarJSON = document.getElementById('btnExportarJSON');
    if (btnExportarJSON) {
        btnExportarJSON.addEventListener('click', exportarInventarioJSON);
    }

    const btnExportarCSVDesdeResumen = document.getElementById('btnExportarCSVDesdeResumen');
    if (btnExportarCSVDesdeResumen) {
        btnExportarCSVDesdeResumen.addEventListener('click', exportarInventarioCSV);
    }

    const btnExportarJSONDesdeResumen = document.getElementById('btnExportarJSONDesdeResumen');
    if (btnExportarJSONDesdeResumen) {
        btnExportarJSONDesdeResumen.addEventListener('click', exportarInventarioJSON);
    }

    const btnMenuRestablecer = document.getElementById('btnMenuRestablecer');
    if (btnMenuRestablecer) {
        btnMenuRestablecer.addEventListener('click', (e) => {
            restablecerDatosIniciales();
        });
    }

    const btnMenuVaciar = document.getElementById('btnMenuVaciar');
    if (btnMenuVaciar) {
        btnMenuVaciar.addEventListener('click', (e) => {
            vaciarInventarioCompleto();
        });
    }

    // Guardar y devolver el foco permite continuar con teclado desde el control que abrió el modal.
    // --- Accesibilidad: Devolver el foco al elemento disparador cuando se cierran los modales ---
    const modales = document.querySelectorAll('.modal');
    modales.forEach(modalEl => {
        modalEl.addEventListener('hidden.bs.modal', () => {
            if (ultimoElementoFoco && typeof ultimoElementoFoco.focus === 'function') {
                ultimoElementoFoco.focus();
                ultimoElementoFoco = null;
            }
        });
    });
}

/* ==============================================================================
   14. INICIALIZACIÓN DE LA APLICACIÓN (DOMCONTENTLOADED)
   ============================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // Punto de entrada: prepara Bootstrap, carga datos, conecta eventos y dibuja la pantalla inicial.
    // 1. Inicializar componentes de Bootstrap 5.3
    const elModalProducto = document.getElementById('modalProducto');
    const elModalMovimiento = document.getElementById('modalMovimiento');
    const elModalDetalle = document.getElementById('modalDetalle');
    const elModalEliminar = document.getElementById('modalEliminar');
    const elModalConfirmarAccion = document.getElementById('modalConfirmarAccion');
    const elModalResumen = document.getElementById('modalResumen');
    const elOffcanvasFiltros = document.getElementById('offcanvasFiltros');
    const elToast = document.getElementById('toastNotificacion');

    if (window.bootstrap) {
        if (elModalProducto) bsModalProducto = new window.bootstrap.Modal(elModalProducto);
        if (elModalMovimiento) bsModalMovimiento = new window.bootstrap.Modal(elModalMovimiento);
        if (elModalDetalle) bsModalDetalle = new window.bootstrap.Modal(elModalDetalle);
        if (elModalEliminar) bsModalEliminar = new window.bootstrap.Modal(elModalEliminar);
        if (elModalConfirmarAccion) bsModalConfirmarAccion = new window.bootstrap.Modal(elModalConfirmarAccion);
        if (elModalResumen) bsModalResumen = new window.bootstrap.Modal(elModalResumen);
        if (elOffcanvasFiltros) bsOffcanvasFiltros = new window.bootstrap.Offcanvas(elOffcanvasFiltros);
        if (elToast) bsToastNotificacion = new window.bootstrap.Toast(elToast, { delay: 4000 });
    }

    // 2. Cargar datos desde localStorage o semilla inicial
    cargarProductosDesdeStorage();

    // 3. Registrar eventos interactivos
    registrarEventos();

    // 4. Renderizar vista inicial
    renderizarDashboard();
    renderizarTabla();
});
