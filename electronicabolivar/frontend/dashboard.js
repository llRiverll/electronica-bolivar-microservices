// =======================================================
// 1. CONFIGURACIÓN GLOBAL Y VARIABLES
// =======================================================
let carrito = [];
let productosGlobal = []; 
let inventarioGlobal = [];
let cantidadPreseleccionada = 1;

// Base de datos local de Categorías
const categoriasDB = {
    "Computadoras": ["Laptops", "PCs de escritorio", "All-in-one", "Mini PC"],
    "Accesorios de Computo": ["Teclados", "Mouse", "Audífonos", "Webcams", "Parlantes", "Discos duros", "Memorias USB"],
    "Monitores": ["Oficina", "Gamer", "Curvos", "Soportes"],
    "Impresión": ["Impresoras", "Multifuncionales", "Tóner", "Cartuchos"],
    "Telefonía": ["Smartphones", "Básicos", "Accesorios", "Cargadores"],
    "Televisores": ["Smart TV", "4K", "Audio", "Soportes TV"],
    "Videojuegos": ["Consolas", "Juegos", "Mandos", "Sillas Gamer"],
    "Componentes PC": ["Placas Madre", "Procesadores", "RAM", "Tarjetas de Video", "Fuentes", "Cases"],
    "Redes": ["Routers", "Repetidores", "Cables de Red"],
    "Domótica": ["Cámaras IP", "Focos Inteligentes", "Asistentes de Voz"]
};

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    const usuario = localStorage.getItem('usuario_bolivar');
    if (!usuario) window.location.href = 'index.html';
    
    document.getElementById('user-name').textContent = usuario;
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('fecha-header').textContent = new Date().toLocaleDateString('es-ES', options);
    
    // Configurar funciones globales para los Modals de SweetAlert
    window.selPago = function(el, metodo) {
        document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
        document.getElementById('pay-method').value = metodo;
        const rowRec = document.getElementById('row-recibido');
        if(metodo !== 'EFECTIVO') {
            rowRec.style.opacity = '0.3'; 
            document.getElementById('pay-amount').disabled = true;
        } else {
            rowRec.style.opacity = '1';
            document.getElementById('pay-amount').disabled = false;
        }
    };

    window.calcVuelto = function(total) {
        const recibido = parseFloat(document.getElementById('pay-amount').value) || 0;
        const vuelto = recibido - total;
        const el = document.getElementById('pay-change');
        el.textContent = 'S/. ' + (vuelto > 0 ? vuelto.toFixed(2) : '0.00');
        el.style.color = vuelto < 0 ? 'red' : '#28a745';
    };

    cargarModulo('inicio');
});

function cerrarSesion() { localStorage.clear(); window.location.href = 'index.html'; }

// CONTROLADOR DE MÓDULOS
function cargarModulo(modulo) {
    const titulo = document.getElementById('page-title');
    const contenido = document.getElementById('contenido-dinamico');
    contenido.innerHTML = '';

    document.querySelectorAll('.menu a').forEach(a => a.classList.remove('active'));
    
    const modulos = {
        'inicio': { t: 'Dashboard General', f: renderInicio },
        'ventas': { t: 'Punto de Venta (POS)', f: renderVentas },
        'productos': { t: 'Gestión de Productos', f: renderProductos },
        'inventario': { t: 'Control de Almacén', f: renderInventario },
        'reportes': { t: 'Reportes Financieros', f: renderReportes },
        'usuarios': { t: 'Gestión de Personal', f: renderUsuarios } // <--- ESTO ES CRUCIAL
    };

    if(modulos[modulo]) {
        titulo.textContent = modulos[modulo].t;
        modulos[modulo].f(contenido);
    }
}

// =======================================================
// 2. MÓDULO INICIO (DASHBOARD OPERATIVO PRO)
// =======================================================
async function renderInicio(c) {
    // 1. Estructura "Skeleton" (Se ve profesional mientras carga)
    c.innerHTML = `
        <div class="stats-grid" style="margin-bottom:20px;">
            <div class="card" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color:white; grid-column: span 2; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h2 style="margin:0; font-size:1.8rem;">👋 Bienvenido, ${localStorage.getItem('usuario_bolivar')}</h2>
                    <p style="opacity:0.7; margin:5px 0;">Panel de Control General</p>
                </div>
                <div style="display:flex; gap:10px;">
                    <button class="btn" style="background:#3b82f6; color:white; border:none;" onclick="cargarModulo('ventas')">
                        <i class="fa-solid fa-cash-register"></i> Nueva Venta
                    </button>
                    <button class="btn" style="background:#10b981; color:white; border:none;" onclick="cargarModulo('inventario')">
                        <i class="fa-solid fa-box"></i> Ver Stock
                    </button>
                </div>
            </div>

            <div class="card" style="text-align:center; display:flex; flex-direction:column; justify-content:center;">
                <h2 id="clock-time" style="margin:0; font-size:2rem; color:var(--primary);">--:--</h2>
                <span id="clock-date" style="color:var(--text-muted); font-size:0.9rem;">...</span>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card" style="border-top: 4px solid #10b981">
                <div class="stat-info"><h3 id="dash-ingreso" style="color:#10b981">S/. ...</h3><p>Caja del Día</p></div>
                <div class="stat-icon"><i class="fa-solid fa-coins"></i></div>
            </div>
            <div class="stat-card" style="border-top: 4px solid #3b82f6">
                <div class="stat-info"><h3 id="dash-ventas" style="color:#3b82f6">...</h3><p>Pedidos Hoy</p></div>
                <div class="stat-icon"><i class="fa-solid fa-receipt"></i></div>
            </div>
            <div class="stat-card" style="border-top: 4px solid #f59e0b">
                <div class="stat-info"><h3 id="dash-stock-bajo" style="color:#f59e0b">...</h3><p>Stock Bajo</p></div>
                <div class="stat-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
            </div>
            <div class="stat-card" style="border-top: 4px solid #ef4444">
                <div class="stat-info"><h3 id="dash-critico" style="color:#ef4444">...</h3><p>Agotados</p></div>
                <div class="stat-icon"><i class="fa-solid fa-circle-xmark"></i></div>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px; margin-top:20px;">
            <div class="card">
                <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                    <h3><i class="fa-solid fa-clock-rotate-left"></i> Actividad Reciente</h3>
                    <small style="color:var(--primary); cursor:pointer;" onclick="cargarModulo('reportes')">Ver todo</small>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead><tr><th>Hora</th><th>Tipo</th><th>Detalle</th><th>Monto</th></tr></thead>
                        <tbody id="dash-activity-body"><tr><td colspan="4" style="text-align:center">Cargando...</td></tr></tbody>
                    </table>
                </div>
            </div>

            <div class="card" style="background:#fff7ed; border:1px solid #ffedd5;">
                <h3 style="color:#c2410c; margin-bottom:15px;"><i class="fa-solid fa-bell"></i> Avisos del Sistema</h3>
                <ul id="dash-alerts" style="padding-left:20px; color:#9a3412;">
                    <li>Cargando alertas...</li>
                </ul>
                <button class="btn" style="width:100%; margin-top:20px; background:#fff; border:1px solid #fdba74; color:#c2410c;" onclick="cargarModulo('inventario')">
                    Gestionar Almacén
                </button>
            </div>
        </div>
    `;

    // 2. Reloj en Vivo
    actualizarReloj();
    setInterval(actualizarReloj, 60000); // Actualiza cada minuto

    // 3. Cargar Datos Reales
    try {
        // A. Finanzas
        const resRep = await fetch('http://localhost:5006/reportes/resumen');
        const dataRep = await resRep.json();
        
        document.getElementById('dash-ingreso').textContent = 'S/. ' + dataRep.kpis.dinero_total.toFixed(2);
        document.getElementById('dash-ventas').textContent = dataRep.kpis.cantidad_ventas;

        // B. Inventario (Alertas)
        const resInv = await fetch('http://localhost:5003/inventario');
        const dataInv = await resInv.json();
        
        const bajos = dataInv.filter(i => i.stock < 5 && i.stock > 0).length;
        const agotados = dataInv.filter(i => i.stock <= 0).length;

        document.getElementById('dash-stock-bajo').textContent = bajos;
        document.getElementById('dash-critico').textContent = agotados;

        // Llenar lista de alertas
        const listaAlertas = document.getElementById('dash-alerts');
        listaAlertas.innerHTML = '';
        if (agotados > 0) listaAlertas.innerHTML += `<li>⚠️ Hay <b>${agotados}</b> productos agotados que requieren atención.</li>`;
        if (bajos > 0) listaAlertas.innerHTML += `<li>📉 Hay <b>${bajos}</b> productos con stock bajo.</li>`;
        if (agotados === 0 && bajos === 0) listaAlertas.innerHTML = '<li>✅ Todo el inventario está en orden.</li>';

        // C. Últimos Pagos (Actividad)
        const resPag = await fetch('http://localhost:5005/pagos');
        const dataPag = await resPag.json();
        
        const tbody = document.getElementById('dash-activity-body');
        tbody.innerHTML = '';
        // Mostramos solo los últimos 5
        dataPag.slice(0, 5).forEach(p => {
            const hora = new Date(p.fecha_pago).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            tbody.innerHTML += `
                <tr>
                    <td><span class="badge" style="background:#f1f5f9; color:#64748b">${hora}</span></td>
                    <td><span style="font-weight:bold; color:#16a34a">VENTA</span></td>
                    <td>${p.cliente} <small style="color:#aaa">(${p.metodo})</small></td>
                    <td style="font-weight:bold">S/. ${p.monto}</td>
                </tr>
            `;
        });

    } catch (e) {
        console.error(e);
        // Si falla, no rompemos la UI, solo mostramos guiones
        document.getElementById('dash-ingreso').textContent = '-';
    }
}

function actualizarReloj() {
    const now = new Date();
    document.getElementById('clock-time').textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    document.getElementById('clock-date').textContent = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
}

// =======================================================
// 3. MÓDULO PRODUCTOS (CRUD PRO + EDICIÓN)
// =======================================================
function renderProductos(container) {
    container.innerHTML = `
        <div class="card">
            <h3 style="border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:20px; display:flex; justify-content:space-between;">
                <span><i class="fa-solid fa-box-open"></i> Registro de Productos</span>
                <button onclick="limpiarFormulario()" class="btn-success" style="font-size:0.8rem"><i class="fa-solid fa-plus"></i> Nuevo</button>
            </h3>
            
            <div style="display:grid; grid-template-columns: 2fr 1fr; gap:30px;">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                    <input type="hidden" id="p-id"> 
                    <div style="grid-column: span 2"><label style="font-weight:bold; color:#555">Nombre</label><input type="text" id="p-nom" placeholder="Ej: Laptop HP"></div>
                    <div><label style="font-weight:bold; color:#555">Categoría</label><select id="p-cat" onchange="cargarSubcategorias()"><option value="">Seleccione...</option></select></div>
                    <div><label style="font-weight:bold; color:#555">Subcategoría</label><select id="p-sub" disabled><option>Esperando...</option></select></div>
                    <div><label style="font-weight:bold; color:#555">Marca</label><input type="text" id="p-marca" placeholder="Marca"></div>
                    <div><label style="font-weight:bold; color:#555">Precio (S/.)</label><input type="number" id="p-pre" placeholder="0.00"></div>
                    <div style="grid-column: span 2"><label style="font-weight:bold; color:#555">Imagen URL</label><input type="text" id="p-img" placeholder="https://..." onchange="previsualizarImagen()"></div>
                    <div style="grid-column: span 2"><textarea id="p-desc" rows="2" style="width:100%; border:1px solid #dee2e6; border-radius:5px;" placeholder="Descripción..."></textarea></div>
                    <div style="grid-column: span 2">
                        <button onclick="guardarProducto()" id="btn-guardar" style="width:100%; justify-content:center; padding:12px;" class="btn btn-primary"><i class="fa-solid fa-save"></i> GUARDAR PRODUCTO</button>
                    </div>
                </div>
                <div style="text-align:center; padding:20px; border:1px dashed #ccc; border-radius:10px;">
                    <label style="font-weight:bold; color:#aaa; display:block; margin-bottom:10px">Vista Previa</label>
                    <img id="img-preview" src="https://via.placeholder.com/150?text=Sin+Imagen" style="max-width:100%; max-height:200px; border-radius:8px;">
                </div>
            </div>
        </div>
        <div class="card" style="margin-top:20px;">
            <h3><i class="fa-solid fa-list"></i> Inventario</h3>
            <div class="table-responsive">
                <table class="data-table"><thead><tr><th>Img</th><th>Producto</th><th>Categoría</th><th>Precio</th><th>Acciones</th></tr></thead>
                <tbody id="tabla-productos-body"><tr><td colspan="5">Cargando...</td></tr></tbody></table>
            </div>
        </div>`;
    llenarSelectCategorias();
    obtenerProductos();
}

function llenarSelectCategorias() {
    const select = document.getElementById('p-cat');
    select.innerHTML = '<option value="">Seleccione...</option>';
    Object.keys(categoriasDB).forEach(cat => {
        const option = document.createElement('option');
        option.value = cat; option.textContent = cat;
        select.appendChild(option);
    });
}

function cargarSubcategorias(subSel = null) {
    const cat = document.getElementById('p-cat').value;
    const subSelect = document.getElementById('p-sub');
    subSelect.innerHTML = '';
    if (cat && categoriasDB[cat]) {
        subSelect.disabled = false;
        categoriasDB[cat].forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub; opt.textContent = sub;
            subSelect.appendChild(opt);
        });
        if(subSel) subSelect.value = subSel;
    } else {
        subSelect.innerHTML = '<option>Esperando...</option>';
        subSelect.disabled = true;
    }
}

function previsualizarImagen() {
    const url = document.getElementById('p-img').value;
    document.getElementById('img-preview').src = url || 'https://via.placeholder.com/150?text=Sin+Imagen';
}

async function obtenerProductos() {
    try {
        const res = await fetch('http://localhost:5002/productos');
        const data = await res.json();
        const tbody = document.getElementById('tabla-productos-body');
        tbody.innerHTML = '';
        data.forEach(p => {
            const jsonProd = JSON.stringify(p).replace(/"/g, '&quot;');
            const img = p.imagen_url || 'https://via.placeholder.com/50';
            tbody.innerHTML += `<tr>
                <td><img src="${img}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;"></td>
                <td><b>${p.nombre}</b><br><small>${p.marca||''}</small></td>
                <td><span class="badge bg-ok">${p.categoria||'-'}</span></td>
                <td style="font-weight:bold">S/. ${p.precio_unitario}</td>
                <td>
                    <button class="btn btn-primary" style="padding:5px 10px;" onclick="cargarDatosEdicion(${jsonProd})"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-danger" style="padding:5px 10px;" onclick="eliminarProducto(${p.id})"><i class="fa-solid fa-trash"></i></button>
                </td></tr>`;
        });
    } catch (e) { console.error(e); }
}

async function guardarProducto() {
    const id = document.getElementById('p-id').value;
    const body = {
        nombre: document.getElementById('p-nom').value,
        categoria: document.getElementById('p-cat').value,
        subcategoria: document.getElementById('p-sub').value,
        marca: document.getElementById('p-marca').value,
        precio_unitario: document.getElementById('p-pre').value,
        descripcion: document.getElementById('p-desc').value,
        imagen_url: document.getElementById('p-img').value
    };
    if (!body.nombre || !body.precio_unitario) return Swal.fire('Error', 'Datos incompletos', 'warning');
    let url = 'http://localhost:5002/productos'; let method = 'POST';
    if (id) { url += `/${id}`; method = 'PUT'; }
    try {
        await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        Swal.fire('Éxito', 'Guardado correctamente', 'success');
        limpiarFormulario(); obtenerProductos();
    } catch (e) { Swal.fire('Error', 'Fallo conexión', 'error'); }
}

function cargarDatosEdicion(p) {
    document.getElementById('p-id').value = p.id;
    document.getElementById('p-nom').value = p.nombre;
    document.getElementById('p-marca').value = p.marca||'';
    document.getElementById('p-pre').value = p.precio_unitario;
    document.getElementById('p-desc').value = p.descripcion||'';
    document.getElementById('p-img').value = p.imagen_url||'';
    document.getElementById('p-cat').value = p.categoria;
    cargarSubcategorias(p.subcategoria);
    previsualizarImagen();
    const btn = document.getElementById('btn-guardar');
    btn.innerHTML = '<i class="fa-solid fa-rotate"></i> ACTUALIZAR';
    btn.classList.replace('btn-primary', 'btn-warning');
}

function limpiarFormulario() {
    document.getElementById('p-id').value = '';
    document.getElementById('p-nom').value = '';
    document.getElementById('p-marca').value = '';
    document.getElementById('p-pre').value = '';
    document.getElementById('p-desc').value = '';
    document.getElementById('p-img').value = '';
    document.getElementById('p-cat').value = '';
    document.getElementById('p-sub').innerHTML = '<option>Esperando...</option>';
    document.getElementById('p-sub').disabled = true;
    document.getElementById('img-preview').src = 'https://via.placeholder.com/150?text=Sin+Imagen';
    const btn = document.getElementById('btn-guardar');
    btn.innerHTML = '<i class="fa-solid fa-save"></i> GUARDAR PRODUCTO';
    btn.classList.replace('btn-warning', 'btn-primary');
}

function eliminarProducto(id) {
    Swal.fire({title:'¿Eliminar?', text:"No podrás revertirlo", icon:'warning', showCancelButton:true, confirmButtonText:'Sí, borrar'}).then(async (r)=>{
        if(r.isConfirmed) { await fetch(`http://localhost:5002/productos/${id}`, {method:'DELETE'}); obtenerProductos(); Swal.fire('Borrado','','success'); }
    });
}

// =======================================================
// 4. MÓDULO INVENTARIO (KARDEX & GESTIÓN AVANZADA)
// =======================================================

function renderInventario(c) {
    c.innerHTML = `
        <div class="stats-grid" style="margin-bottom:20px;">
            <div class="stat-card" style="border-left:4px solid #6366f1;"><div class="stat-info"><h3 id="kpi-total">...</h3><p>Productos</p></div></div>
            <div class="stat-card" style="border-left:4px solid #10b981;"><div class="stat-info"><h3 id="kpi-valor">...</h3><p>Valorización</p></div></div>
            <div class="stat-card" style="border-left:4px solid #ef4444;"><div class="stat-info"><h3 id="kpi-alertas">...</h3><p>Stock Crítico</p></div></div>
        </div>

        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3><i class="fa-solid fa-boxes-stacked"></i> Control de Almacén</h3>
                <div style="display:flex; gap:10px">
                    <button class="btn btn-primary" onclick="listarInventario()"><i class="fa-solid fa-rotate"></i></button>
                    <input type="text" id="inv-search" placeholder="🔍 Buscar producto..." style="width:250px;" onkeyup="filtrarInventario()">
                </div>
            </div>
            <div class="table-responsive">
                <table class="data-table" id="tabla-inv">
                    <thead><tr><th>Producto</th><th>Categoría</th><th>Stock Físico</th><th>Estado</th><th>Valor Total</th><th>Acciones</th></tr></thead>
                    <tbody id="t-inv-body"><tr><td colspan="6">Cargando...</td></tr></tbody>
                </table>
            </div>
        </div>`;
    listarInventario();
}

async function listarInventario() {
    try {
        const res = await fetch('http://localhost:5003/inventario');
        inventarioGlobal = await res.json();
        renderTablaInventario(inventarioGlobal);
    } catch(e) { console.error(e); }
}

function renderTablaInventario(datos) {
    const tb = document.getElementById('t-inv-body');
    tb.innerHTML = '';
    
    // Calcular KPIs
    const totalV = datos.reduce((acc, i) => acc + (parseFloat(i.valor_total)||0), 0);
    const criticos = datos.filter(i => i.stock < 5).length;
    document.getElementById('kpi-total').textContent = datos.length;
    document.getElementById('kpi-valor').textContent = 'S/. ' + totalV.toLocaleString('es-PE', {minimumFractionDigits:2});
    document.getElementById('kpi-alertas').textContent = criticos;

    if(datos.length===0) { tb.innerHTML='<tr><td colspan="6" style="text-align:center; padding:20px">Inventario vacío</td></tr>'; return; }

    datos.forEach(i => {
        const img = i.imagen_url || 'https://via.placeholder.com/50';
        const nombreSeguro = i.nombre.replace(/"/g, '&quot;');
        
        let estado = i.stock<=0 ? '<span class="badge bg-err">AGOTADO</span>' : (i.stock<5 ? '<span class="badge bg-warn">CRÍTICO</span>' : '<span class="badge bg-ok">NORMAL</span>');
        let percent = Math.min(i.stock*2, 100);
        let color = i.stock<5 ? '#ef4444' : '#10b981';
        let bar = `<div style="width:100%; background:#e2e8f0; height:6px; border-radius:4px; margin-top:5px;"><div style="width:${percent}%; background:${color}; height:100%"></div></div>`;

        tb.innerHTML += `
            <tr>
                <td style="display:flex; align-items:center; gap:10px">
                    <img src="${img}" style="width:40px; height:40px; border-radius:4px; object-fit:cover; border:1px solid #eee">
                    <div style="overflow:hidden;"><div style="font-weight:bold; white-space:nowrap; text-overflow:ellipsis; max-width:200px" title="${nombreSeguro}">${i.nombre}</div><small style="color:#666">${i.marca||''}</small></div>
                </td>
                <td><span class="badge" style="background:#f1f5f9; color:#475569">${i.categoria||'-'}</span></td>
                <td style="width:120px"><b>${i.stock} un.</b> ${bar}</td>
                <td>${estado}</td>
                <td style="color:var(--primary); font-weight:bold">S/. ${(parseFloat(i.valor_total)||0).toFixed(2)}</td>
                <td>
                    <div style="display:flex; gap:5px">
                        <button class="btn" style="background:#10b981; color:white; padding:6px 10px;" onclick="modalMovimiento(${i.producto_id}, '${nombreSeguro}', 'ENTRADA')" title="Registrar Ingreso"><i class="fa-solid fa-plus"></i></button>
                        <button class="btn" style="background:#ef4444; color:white; padding:6px 10px;" onclick="modalMovimiento(${i.producto_id}, '${nombreSeguro}', 'SALIDA')" title="Registrar Salida/Merma"><i class="fa-solid fa-minus"></i></button>
                        <button class="btn" style="background:#6366f1; color:white; padding:6px 10px;" onclick="verKardex(${i.producto_id}, '${nombreSeguro}')" title="Ver Historial Kardex"><i class="fa-solid fa-clock-rotate-left"></i></button>
                    </div>
                </td>
            </tr>`;
    });
}

// 1. MODAL DE MOVIMIENTOS (COMPRA / VENTA / MERMA)
async function modalMovimiento(id, nombre, tipo) {
    const esEntrada = tipo === 'ENTRADA';
    const titulo = esEntrada ? '🟢 Registrar Ingreso' : '🔴 Registrar Salida';
    const opcionesMotivo = esEntrada 
        ? `<option value="COMPRA">Compra a Proveedor</option><option value="DEVOLUCION">Devolución de Cliente</option><option value="AJUSTE">Ajuste de Inventario</option>`
        : `<option value="MERMA">Merma / Dañado</option><option value="USO_INTERNO">Uso Interno</option><option value="ROBO">Pérdida / Robo</option><option value="AJUSTE">Ajuste de Inventario</option>`;

    const { value: form } = await Swal.fire({
        title: titulo,
        html: `
            <div style="text-align:left; margin-bottom:15px; color:#555">Producto: <b>${nombre}</b></div>
            
            <label style="display:block; text-align:left; font-size:0.8rem; font-weight:bold">Motivo del Movimiento</label>
            <select id="swal-motivo" class="swal2-input" style="margin-top:5px">${opcionesMotivo}</select>

            <div style="display:flex; gap:10px; margin-top:10px">
                <div style="flex:1">
                    <label style="display:block; text-align:left; font-size:0.8rem; font-weight:bold">Cantidad</label>
                    <input id="swal-cant" type="number" class="swal2-input" placeholder="0" min="1" style="margin:5px 0 0 0">
                </div>
                <div style="flex:2">
                    <label style="display:block; text-align:left; font-size:0.8rem; font-weight:bold">Documento Ref. (Opcional)</label>
                    <input id="swal-ref" class="swal2-input" placeholder="Factura F001..." style="margin:5px 0 0 0">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar Movimiento',
        confirmButtonColor: esEntrada ? '#10b981' : '#ef4444',
        focusConfirm: false,
        preConfirm: () => {
            const cant = document.getElementById('swal-cant').value;
            if(!cant || cant<=0) Swal.showValidationMessage('Cantidad inválida');
            return {
                cantidad: cant,
                motivo: document.getElementById('swal-motivo').value,
                referencia: document.getElementById('swal-ref').value || '-'
            }
        }
    });

    if (form) {
        try {
            await fetch('http://localhost:5003/inventario/ajuste', {
                method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({
                    producto_id: id,
                    tipo: tipo,
                    cantidad: parseInt(form.cantidad),
                    motivo: form.motivo,
                    referencia: form.referencia
                })
            });
            Swal.fire('Registrado', 'El stock y el kardex han sido actualizados.', 'success');
            listarInventario();
        } catch(e) { Swal.fire('Error', 'Fallo de conexión', 'error'); }
    }
}

// 2. VER HISTORIAL KARDEX
async function verKardex(id, nombre) {
    try {
        const res = await fetch(`http://localhost:5003/inventario/kardex/${id}`);
        const data = await res.json();
        
        let htmlTabla = `
            <div style="max-height:300px; overflow-y:auto; text-align:left;">
                <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                    <thead><tr style="background:#f8f9fa; border-bottom:2px solid #eee;">
                        <th style="padding:8px">Fecha</th>
                        <th style="padding:8px">Movimiento</th>
                        <th style="padding:8px">Cant.</th>
                        <th style="padding:8px">Saldo</th>
                        <th style="padding:8px">Ref.</th>
                    </tr></thead>
                    <tbody>
        `;

        if(data.length === 0) htmlTabla += '<tr><td colspan="5" style="text-align:center; padding:10px">Sin movimientos</td></tr>';
        
        data.forEach(m => {
            const esEntrada = m.tipo_movimiento === 'ENTRADA';
            const color = esEntrada ? 'green' : 'red';
            const signo = esEntrada ? '+' : '-';
            const fecha = new Date(m.fecha).toLocaleDateString() + ' ' + new Date(m.fecha).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'});
            
            htmlTabla += `
                <tr style="border-bottom:1px solid #f1f1f1">
                    <td style="padding:8px; color:#666">${fecha}</td>
                    <td style="padding:8px">
                        <span style="font-weight:bold; color:${color}">${m.tipo_movimiento}</span><br>
                        <small>${m.motivo}</small>
                    </td>
                    <td style="padding:8px; font-weight:bold; color:${color}">${signo}${m.cantidad}</td>
                    <td style="padding:8px; font-weight:bold">${m.stock_nuevo}</td>
                    <td style="padding:8px; color:#888">${m.referencia}</td>
                </tr>`;
        });

        htmlTabla += '</tbody></table></div>';

        Swal.fire({
            title: `Kardex: ${nombre}`,
            html: htmlTabla,
            width: '700px',
            showConfirmButton: false,
            showCloseButton: true
        });

    } catch(e) { Swal.fire('Error', 'No se pudo cargar el historial', 'error'); }
}

function filtrarInventario() {
    const txt = document.getElementById('inv-search').value.toLowerCase();
    const fil = inventarioGlobal.filter(i => i.nombre.toLowerCase().includes(txt) || (i.marca && i.marca.toLowerCase().includes(txt)));
    renderTablaInventario(fil);
}

// =======================================================
// 5. MÓDULO VENTAS (POS PROFESIONAL)
// =======================================================
async function renderVentas(container) {
    carrito = [];
    cantidadPreseleccionada = 1;
    container.innerHTML = `
        <div class="pos-layout">
            <div class="pos-catalog">
                <div class="pos-toolbar">
                    <i class="fa-solid fa-magnifying-glass" style="color:#aaa"></i>
                    <input type="text" id="pos-search" placeholder="Buscar producto..." style="flex:1; border:none" onkeyup="filtrarPOS()">
                    <div style="border-left:1px solid #ddd; padding-left:10px; display:flex; align-items:center; gap:5px;">
                        <small>Cant:</small><input type="number" class="qty-preset" id="qty-preset" value="1" min="1" onchange="cantidadPreseleccionada=parseInt(this.value)">
                    </div>
                </div>
                <div id="pos-grid" class="product-grid">Cargando...</div>
            </div>
            <div class="pos-ticket">
                <div class="ticket-header" style="background:#1e293b; display:flex; justify-content:space-between">
                    <h3 style="margin:0; font-size:1rem">TICKET VENTA</h3>
                    <button class="btn btn-danger" style="padding:2px 8px; font-size:0.7rem" onclick="limpiarCarrito()">Limpiar</button>
                </div>
                <div class="ticket-body"><table class="ticket-table"><thead><tr><th>Prod</th><th>Cant</th><th>Total</th><th></th></tr></thead><tbody id="pos-cart-body"><tr><td colspan="4" style="text-align:center; padding:20px; color:#aaa">Vacío</td></tr></tbody></table></div>
                <div class="ticket-footer">
                    <div style="display:flex; justify-content:space-between; font-size:1.5rem; font-weight:800; margin-bottom:10px"><span>TOTAL:</span> <span id="pos-total">S/. 0.00</span></div>
                    <button class="btn btn-success" style="width:100%; justify-content:center; padding:15px; font-size:1.2rem" onclick="abrirModalCobro()">COBRAR <i class="fa-solid fa-money-bill-wave"></i></button>
                </div>
            </div>
        </div>`;
    cargarProductosPOS();
}

async function cargarProductosPOS() {
    try {
        const res = await fetch('http://localhost:5003/inventario');
        productosGlobal = await res.json();
        dibujarGrid(productosGlobal);
    } catch(e) { console.error(e); }
}

function dibujarGrid(lista) {
    const grid = document.getElementById('pos-grid');
    grid.innerHTML = '';
    if(lista.length === 0) { grid.innerHTML = '<p style="text-align:center; width:100%">No hay productos</p>'; return; }
    lista.forEach(p => {
        const agotado = p.stock <= 0;
        const img = p.imagen_url || 'https://via.placeholder.com/150';
        grid.innerHTML += `
            <div class="product-card ${agotado?'disabled':''}" onclick="${agotado?'':`agregarCarrito(${p.producto_id})`}">
                <div class="stock-badge ${p.stock<5?'low':''}">${agotado?'AGOTADO':p.stock}</div>
                <img src="${img}" style="width:60px; height:60px; object-fit:contain; margin:10px auto; display:block">
                <div style="font-weight:600; font-size:0.85rem; height:36px; overflow:hidden">${p.nombre}</div>
                <div class="p-price">S/. ${p.precio_unitario}</div>
            </div>`;
    });
}

function filtrarPOS() {
    const txt = document.getElementById('pos-search').value.toLowerCase();
    dibujarGrid(productosGlobal.filter(p => p.nombre.toLowerCase().includes(txt)));
}

function agregarCarrito(id) {
    const prod = productosGlobal.find(x => x.producto_id === id);
    if(!prod) return;
    const item = carrito.find(x => x.id === id);
    const cantAgregar = cantidadPreseleccionada > 0 ? cantidadPreseleccionada : 1;

    if (item) {
        if (item.cantidad + cantAgregar > prod.stock) return Swal.fire({toast:true, position:'top-end', icon:'error', title:'Stock insuficiente', showConfirmButton:false, timer:1500});
        item.cantidad += cantAgregar;
    } else {
        if (cantAgregar > prod.stock) return Swal.fire({toast:true, position:'top-end', icon:'error', title:'Stock insuficiente', showConfirmButton:false, timer:1500});
        carrito.push({id:prod.producto_id, nombre:prod.nombre, precio:parseFloat(prod.precio_unitario), cantidad:cantAgregar, max:prod.stock});
    }
    document.getElementById('qty-preset').value = 1; cantidadPreseleccionada = 1;
    actualizarTicket();
}

function actualizarTicket() {
    const tb = document.getElementById('pos-cart-body');
    const tot = document.getElementById('pos-total');
    tb.innerHTML = '';
    let total = 0;

    if(carrito.length === 0) {
        tb.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#aaa">Vacío</td></tr>';
    } else {
        carrito.forEach((i, idx) => {
            let sub = i.precio * i.cantidad;
            total += sub;
            
            // AHORA EL INPUT ES EDITABLE DIRECTAMENTE
            tb.innerHTML += `
                <tr>
                    <td><div class="ticket-prod-name" title="${i.nombre}">${i.nombre}</div></td>
                    <td>
                        <div class="qty-control">
                            <button class="btn-qty" onclick="cambiarCant(${idx}, -1)">-</button>
                            <input type="number" min="1" max="${i.max}" value="${i.cantidad}" 
                                   class="qty-input" 
                                   onchange="setCantidadManual(${idx}, this.value)"
                                   onfocus="this.select()"> <button class="btn-qty" onclick="cambiarCant(${idx}, 1)">+</button>
                        </div>
                    </td>
                    <td style="text-align:right">S/. ${sub.toFixed(2)}</td>
                    <td style="text-align:center">
                        <i class="fa-solid fa-trash-can" style="color:#ff4d4d; cursor:pointer;" onclick="delItem(${idx})"></i>
                    </td>
                </tr>`;
        });
    }
    tot.textContent = 'S/. ' + total.toFixed(2);
}

// NUEVA FUNCIÓN PARA ESCRIBIR CANTIDAD MANUALMENTE
function setCantidadManual(idx, valor) {
    let nuevaCant = parseInt(valor);
    const item = carrito[idx];

    if (isNaN(nuevaCant) || nuevaCant < 1) {
        nuevaCant = 1; // Mínimo 1
    }
    
    if (nuevaCant > item.max) {
        Swal.fire({
            toast: true, position: 'center', icon: 'warning', 
            title: 'Stock Insuficiente', text: `Solo hay ${item.max} unidades disponibles.`,
            showConfirmButton: false, timer: 2000
        });
        nuevaCant = item.max;
    }

    item.cantidad = nuevaCant;
    actualizarTicket(); // Recalcular subtotales
}

function cambiarCant(idx, delta) {
    const item = carrito[idx];
    const nueva = item.cantidad + delta;
    if (nueva < 1) delItem(idx);
    else if (nueva > item.max) Swal.fire({toast:true, position:'center', icon:'warning', title:'Stock Máximo', showConfirmButton:false, timer:1000});
    else { item.cantidad = nueva; actualizarTicket(); }
}
function delItem(i) { carrito.splice(i, 1); actualizarTicket(); }
function limpiarCarrito() { carrito=[]; actualizarTicket(); }

async function abrirModalCobro() {
    if(carrito.length === 0) return Swal.fire('Error', 'Carrito vacío', 'warning');
    const total = parseFloat(document.getElementById('pos-total').textContent.replace('S/. ', ''));

    const { value: res } = await Swal.fire({
        title: 'Finalizar Venta',
        html: `
            <div class="payment-grid">
                <div class="payment-btn active" onclick="selPago(this, 'EFECTIVO')"><i class="fa-solid fa-money-bill-1"></i>Efectivo</div>
                <div class="payment-btn" onclick="selPago(this, 'TARJETA')"><i class="fa-regular fa-credit-card"></i>Tarjeta</div>
                <div class="payment-btn" onclick="selPago(this, 'YAPE')"><i class="fa-solid fa-qrcode"></i>Yape</div>
            </div>
            
            <div style="display:flex; gap:10px; margin-bottom:15px">
                <input id="pay-cli" class="swal2-input" placeholder="Cliente (Dejar vacío para General)" style="flex:1; margin:0">
                <input id="pay-dni" class="swal2-input" placeholder="DNI / RUC (Opcional)" style="flex:1; margin:0">
            </div>

            <div class="checkout-summary">
                <div class="checkout-row"><span>Total a Pagar:</span> <span class="big-total">S/. ${total.toFixed(2)}</span></div>
                <div class="checkout-row" id="row-recibido">
                    <span>Recibido:</span> 
                    <input type="number" id="pay-amount" class="swal2-input" style="width:120px; height:40px; margin:0; text-align:right" value="${total.toFixed(2)}" onkeyup="calcVuelto(${total})" onfocus="this.select()">
                </div>
                <div class="checkout-row" style="margin-top:10px; border-top:1px solid #ddd; padding-top:5px">
                    <span>Vuelto:</span> <span id="pay-change" class="change-display">S/. 0.00</span>
                </div>
            </div>
            <input type="hidden" id="pay-method" value="EFECTIVO">
        `,
        width: '500px', 
        showCancelButton: true, 
        confirmButtonText: 'Confirmar Pago', 
        confirmButtonColor: '#28a745', 
        focusConfirm: false,
        preConfirm: () => { 
            let cli = document.getElementById('pay-cli').value.trim();
            let dni = document.getElementById('pay-dni').value.trim();
            
            // Lógica inteligente: Si está vacío, llenamos por defecto
            if (!cli) cli = "Cliente General";
            if (!dni) dni = "00000000";

            return { 
                cli: cli, 
                dni: dni, 
                metodo: document.getElementById('pay-method').value 
            } 
        }
    });

    if (res) {
        Swal.fire({title:'Procesando...', didOpen:()=>Swal.showLoading()});
        try {
            const r = await fetch('http://localhost:5004/pedidos', {
                method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({cliente_nombre:res.cli, cliente_dni:res.dni, metodo_pago:res.metodo, items:carrito, total:total})
            });
            if(r.ok) {
                const d = await r.json();
                Swal.fire({icon:'success', title:'¡Venta Exitosa!', text:`Ticket #${d.pedido_id} (${res.metodo})`});
                carrito=[]; actualizarTicket(); cargarProductosPOS();
            } else Swal.fire('Error', 'No se pudo guardar', 'error');
        } catch(e) { Swal.fire('Error', 'Fallo conexión', 'error'); }
    }
}

// =======================================================
// 6. MÓDULO REPORTES (PREMIUM & AUDITORÍA)
// =======================================================
async function renderReportes(c) {
    c.innerHTML = `
        <div class="report-header">
            <h3><i class="fa-solid fa-chart-pie"></i> Inteligencia de Negocios</h3>
            <div style="display:flex; gap:10px">
                <div class="filter-bar" style="margin:0">
                    <button class="filter-btn active">Hoy</button>
                    <button class="filter-btn">Semana</button>
                    <button class="filter-btn">Mes</button>
                </div>
                <button class="btn btn-primary btn-print" onclick="window.print()">
                    <i class="fa-solid fa-print"></i> PDF
                </button>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card kpi-card kpi-blue">
                <div class="stat-info"><h3 id="kpi-ingreso">...</h3><p>Ingresos Totales</p></div>
                <div class="stat-icon"><i class="fa-solid fa-money-bill-trend-up"></i></div>
            </div>
            <div class="stat-card kpi-card kpi-green">
                <div class="stat-info"><h3 id="kpi-ventas">...</h3><p>Ventas Cerradas</p></div>
                <div class="stat-icon"><i class="fa-solid fa-handshake"></i></div>
            </div>
            <div class="stat-card kpi-card kpi-orange">
                <div class="stat-info"><h3 id="kpi-ticket">...</h3><p>Ticket Promedio</p></div>
                <div class="stat-icon"><i class="fa-solid fa-receipt"></i></div>
            </div>
            <div class="stat-card kpi-card kpi-purple">
                <div class="stat-info"><h3 id="kpi-metodo">...</h3><p>Método Top</p></div>
                <div class="stat-icon"><i class="fa-solid fa-credit-card"></i></div>
            </div>
        </div>

        <div class="charts-wrapper">
            <div class="chart-card">
                <h4 style="color:#555; border-bottom:1px solid #eee; padding-bottom:10px">Evolución de Ventas</h4>
                <div class="chart-container"><canvas id="chartLine"></canvas></div>
            </div>
            <div class="chart-card">
                <h4 style="color:#555; border-bottom:1px solid #eee; padding-bottom:10px">Mix de Categorías</h4>
                <div class="chart-container"><canvas id="chartDoughnut"></canvas></div>
            </div>
        </div>

        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px">
                <h3><i class="fa-solid fa-magnifying-glass-dollar"></i> Auditoría de Transacciones</h3>
                <input type="text" placeholder="Buscar por cliente o ID..." style="width:200px; padding:5px 10px">
            </div>
            <div class="table-responsive">
                <table class="data-table audit-table">
                    <thead><tr><th>ID</th><th>Cliente</th><th>DNI</th><th>Método</th><th>Monto</th><th>Fecha</th><th>Acción</th></tr></thead>
                    <tbody id="t-pagos"><tr><td colspan="7" style="text-align:center">Cargando datos...</td></tr></tbody>
                </table>
            </div>
        </div>
    `;
    
    try {
        // Cargar Resumen
        const res = await fetch('http://localhost:5006/reportes/resumen');
        const data = await res.json();
        const kpis = data.kpis;

        document.getElementById('kpi-ingreso').textContent = 'S/. ' + kpis.dinero_total.toLocaleString('es-PE', {minimumFractionDigits: 2});
        document.getElementById('kpi-ventas').textContent = kpis.cantidad_ventas;
        document.getElementById('kpi-ticket').textContent = 'S/. ' + kpis.ticket_promedio.toLocaleString('es-PE', {minimumFractionDigits: 2});
        document.getElementById('kpi-metodo').textContent = kpis.metodo_top || '-';

        // Gráfico Línea
        const labelsFecha = data.graficos.ventas_tiempo.map(x => x.fecha);
        const dataVentas = data.graficos.ventas_tiempo.map(x => x.venta);
        
        new Chart(document.getElementById('chartLine'), {
            type: 'line',
            data: {
                labels: labelsFecha,
                datasets: [{
                    label: 'Ventas (S/.)', data: dataVentas,
                    borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true, tension: 0.4, pointRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });

        // Gráfico Dona
        const labelsCat = data.graficos.ventas_categoria.map(x => x.categoria);
        const dataCat = data.graficos.ventas_categoria.map(x => x.cantidad);

        new Chart(document.getElementById('chartDoughnut'), {
            type: 'doughnut',
            data: {
                labels: labelsCat,
                datasets: [{
                    data: dataCat,
                    backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
        });

        // Cargar Tabla Pagos
        const resP = await fetch('http://localhost:5005/pagos');
        const pagos = await resP.json();
        const tb = document.getElementById('t-pagos');
        tb.innerHTML = '';
        
        pagos.forEach(p => {
            const fecha = new Date(p.fecha_pago).toLocaleDateString() + ' ' + new Date(p.fecha_pago).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            let metodoClass = 'bg-warn';
            if(p.metodo === 'EFECTIVO') metodoClass = 'bg-ok';
            if(p.metodo === 'YAPE') metodoClass = 'bg-primary'; // Necesitarás definir bg-primary en CSS o usar style directo

            let badgeMetodo = `<span class="badge ${metodoClass}" style="${p.metodo==='YAPE'?'background:#8b5cf6;color:white':''}">${p.metodo}</span>`;

            tb.innerHTML += `
                <tr>
                    <td><b>#${p.id}</b></td>
                    <td>${p.cliente}</td>
                    <td>${p.dni || '-'}</td>
                    <td>${badgeMetodo}</td>
                    <td style="font-weight:bold">S/. ${parseFloat(p.monto).toFixed(2)}</td>
                    <td style="color:#666; font-size:0.85rem">${fecha}</td>
                    <td>
                        <button class="btn-view" onclick="verDetalleFactura(${p.pedido_id})" title="Ver Detalle">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </td>
                </tr>`;
        });

    } catch (e) { console.error(e); }
}

// NUEVA FUNCIÓN: VER DETALLE (MODAL)
async function verDetalleFactura(pedidoId) {
    try {
        const res = await fetch(`http://localhost:5005/pagos/${pedidoId}`);
        const items = await res.json();
        
        let htmlTabla = `
            <table style="width:100%; border-collapse:collapse; font-size:0.9rem; margin-top:10px;">
                <tr style="background:#f8f9fa; border-bottom:2px solid #eee;">
                    <th style="text-align:left; padding:8px;">Producto</th>
                    <th style="text-align:center; padding:8px;">Cant.</th>
                    <th style="text-align:right; padding:8px;">Subtotal</th>
                </tr>
        `;
        
        let totalCalc = 0;
        items.forEach(i => {
            totalCalc += parseFloat(i.subtotal);
            htmlTabla += `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:8px;">${i.nombre}</td>
                    <td style="text-align:center; padding:8px;">${i.cantidad}</td>
                    <td style="text-align:right; padding:8px;">S/. ${parseFloat(i.subtotal).toFixed(2)}</td>
                </tr>
            `;
        });
        
        htmlTabla += `
            <tr>
                <td colspan="2" style="text-align:right; padding:15px 8px 0; font-weight:bold;">TOTAL:</td>
                <td style="text-align:right; padding:15px 8px 0; font-weight:bold; font-size:1.1rem; color:#0056b3;">S/. ${totalCalc.toFixed(2)}</td>
            </tr>
            </table>
        `;

        Swal.fire({
            title: `Detalle del Pedido #${pedidoId}`,
            html: htmlTabla,
            width: '600px',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#64748b'
        });

    } catch(e) {
        Swal.fire('Error', 'No se pudo cargar el detalle', 'error');
    }
}

// =======================================================
// MÓDULO GESTIÓN DE PERSONAL (RRHH COMPLETO)
// =======================================================

function renderUsuarios(c) {
    c.innerHTML = `
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:15px; margin-bottom:20px;">
                <h3><i class="fa-solid fa-id-card"></i> Ficha de Personal</h3>
                <button onclick="limpiarFormUsuario()" class="btn" style="background:#64748b; color:white; font-size:0.8rem;">
                    <i class="fa-solid fa-eraser"></i> Nuevo Registro
                </button>
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 2fr; gap:30px;">
                <div style="background:#f8fafc; padding:20px; border-radius:10px; border:1px solid #e2e8f0;">
                    <h4 style="margin-top:0; color:#475569; margin-bottom:15px;">🔒 Acceso al Sistema</h4>
                    <input type="hidden" id="u-id">
                    
                    <label style="font-size:0.8rem; font-weight:bold; color:#555">Usuario</label>
                    <input id="u-user" placeholder="Ej: j.perez" style="margin-bottom:10px;">
                    
                    <label style="font-size:0.8rem; font-weight:bold; color:#555">Contraseña</label>
                    <input id="u-pass" type="text" placeholder="******" style="margin-bottom:10px;">
                    
                    <label style="font-size:0.8rem; font-weight:bold; color:#555">Rol de Sistema</label>
                    <select id="u-rol" style="margin-bottom:10px;">
                        <option value="VENDEDOR">Vendedor (Acceso Limitado)</option>
                        <option value="ADMIN">Administrador (Total)</option>
                    </select>

                    <label style="font-size:0.8rem; font-weight:bold; color:#555">Estado</label>
                    <select id="u-estado">
                        <option value="ACTIVO">🟢 Activo</option>
                        <option value="INACTIVO">🔴 Inactivo / Vacaciones</option>
                    </select>
                </div>

                <div>
                    <h4 style="margin-top:0; color:#475569; margin-bottom:15px;">👤 Información del Colaborador</h4>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div style="grid-column: span 2">
                            <label style="font-size:0.8rem; font-weight:bold; color:#555">Nombre Completo</label>
                            <input id="u-nombre" placeholder="Ej: Juan Pérez">
                        </div>

                        <div>
                            <label style="font-size:0.8rem; font-weight:bold; color:#555">Cargo / Puesto</label>
                            <select id="u-cargo">
                                <option value="Vendedor de Piso">Vendedor de Piso</option>
                                <option value="Cajero">Cajero Principal</option>
                                <option value="Técnico">Técnico de Soporte</option>
                                <option value="Supervisor">Supervisor de Tienda</option>
                                <option value="Gerente">Gerente</option>
                            </select>
                        </div>

                        <div>
                            <label style="font-size:0.8rem; font-weight:bold; color:#555">Teléfono / WhatsApp</label>
                            <input id="u-tel" placeholder="Ej: 999888777" type="number">
                        </div>

                        <div style="grid-column: span 2">
                            <label style="font-size:0.8rem; font-weight:bold; color:#555">Correo Electrónico</label>
                            <input id="u-email" placeholder="ejemplo@bolivar.com" type="email">
                        </div>
                    </div>

                    <button id="btn-save-user" class="btn btn-success" onclick="guardarUsuario()" style="width:100%; margin-top:20px; padding:12px;">
                        <i class="fa-solid fa-user-check"></i> GUARDAR COLABORADOR
                    </button>
                </div>
            </div>
        </div>

        <div class="card" style="margin-top:20px;">
            <h3><i class="fa-solid fa-users-viewfinder"></i> Directorio de Personal</h3>
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Colaborador</th>
                            <th>Contacto</th>
                            <th>Cargo</th>
                            <th>Rol Sistema</th>
                            <th>Estado</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody id="t-users-body"><tr><td colspan="6" style="text-align:center">Cargando...</td></tr></tbody>
                </table>
            </div>
        </div>`;
    listarUsuarios();
}

async function listarUsuarios() {
    try {
        const res = await fetch('http://localhost:5001/usuarios');
        const data = await res.json();
        const tb = document.getElementById('t-users-body');
        tb.innerHTML = '';
        
        if(data.length === 0) { tb.innerHTML = '<tr><td colspan="6">Sin datos</td></tr>'; return; }

        data.forEach(u => {
            const estadoBadge = u.estado === 'ACTIVO' 
                ? '<span class="badge bg-ok">ACTIVO</span>' 
                : '<span class="badge bg-err">INACTIVO</span>';
            
            const avatar = u.nombre_completo ? u.nombre_completo.charAt(0) : u.username.charAt(0);
            
            // Botón de WhatsApp
            let btnWsp = '';
            if(u.telefono) {
                btnWsp = `<a href="https://wa.me/51${u.telefono}" target="_blank" class="btn" style="background:#25D366; color:white; padding:4px 8px; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; text-decoration:none;"><i class="fa-brands fa-whatsapp"></i></a>`;
            }

            // Bloquear borrado de admin
            const btnDel = u.username === 'admin' ? '' : `<button class="btn btn-danger" style="padding:5px;" onclick="eliminarUsuario(${u.id})"><i class="fa-solid fa-trash"></i></button>`;
            
            // Convertir objeto a string seguro para el onclick
            const jsonUser = JSON.stringify(u).replace(/"/g, '&quot;');

            tb.innerHTML += `
                <tr>
                    <td>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:35px; height:35px; background:#e2e8f0; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; color:#64748b;">${avatar}</div>
                            <div>
                                <div style="font-weight:bold; font-size:0.9rem;">${u.nombre_completo || u.username}</div>
                                <div style="font-size:0.75rem; color:#aaa;">@${u.username}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div style="display:flex; gap:5px; align-items:center;">
                            ${btnWsp}
                            <div style="font-size:0.8rem;">${u.email || '-'}</div>
                        </div>
                    </td>
                    <td>${u.cargo || 'Vendedor'}</td>
                    <td><span class="badge" style="background:${u.rol==='ADMIN'?'#e0e7ff':'#dcfce7'}; color:${u.rol==='ADMIN'?'#4338ca':'#166534'}">${u.rol}</span></td>
                    <td>${estadoBadge}</td>
                    <td>
                        <div style="display:flex; gap:5px;">
                            <button class="btn btn-primary" style="padding:5px;" onclick="editarUsuario(${jsonUser})"><i class="fa-solid fa-pen"></i></button>
                            ${btnDel}
                        </div>
                    </td>
                </tr>`;
        });
    } catch (e) { console.error(e); }
}

async function guardarUsuario() {
    const id = document.getElementById('u-id').value;
    const body = {
        username: document.getElementById('u-user').value,
        password: document.getElementById('u-pass').value,
        rol: document.getElementById('u-rol').value,
        nombre_completo: document.getElementById('u-nombre').value,
        cargo: document.getElementById('u-cargo').value,
        telefono: document.getElementById('u-tel').value,
        email: document.getElementById('u-email').value,
        estado: document.getElementById('u-estado').value
    };

    if(!body.username || !body.password) return Swal.fire('Error', 'Usuario y contraseña obligatorios', 'warning');

    let url = 'http://localhost:5001/usuarios';
    let method = 'POST';
    if(id) { url += `/${id}`; method = 'PUT'; }

    try {
        await fetch(url, {
            method: method, headers:{'Content-Type':'application/json'},
            body: JSON.stringify(body)
        });
        Swal.fire('Éxito', 'Registro guardado', 'success');
        limpiarFormUsuario(); listarUsuarios();
    } catch(e) { Swal.fire('Error', 'Fallo al guardar', 'error'); }
}

function editarUsuario(u) {
    document.getElementById('u-id').value = u.id;
    document.getElementById('u-user').value = u.username;
    document.getElementById('u-pass').value = u.password_hash;
    document.getElementById('u-rol').value = u.rol;
    document.getElementById('u-nombre').value = u.nombre_completo || '';
    document.getElementById('u-cargo').value = u.cargo || 'Vendedor de Piso';
    document.getElementById('u-tel').value = u.telefono || '';
    document.getElementById('u-email').value = u.email || '';
    document.getElementById('u-estado').value = u.estado || 'ACTIVO';

    const btn = document.getElementById('btn-save-user');
    btn.innerHTML = '<i class="fa-solid fa-rotate"></i> ACTUALIZAR FICHA';
    btn.classList.replace('btn-success', 'btn-warning');
}

function limpiarFormUsuario() {
    document.getElementById('u-id').value = '';
    document.getElementById('u-user').value = '';
    document.getElementById('u-pass').value = '';
    document.getElementById('u-nombre').value = '';
    document.getElementById('u-tel').value = '';
    document.getElementById('u-email').value = '';
    
    const btn = document.getElementById('btn-save-user');
    btn.innerHTML = '<i class="fa-solid fa-user-check"></i> GUARDAR COLABORADOR';
    btn.classList.replace('btn-warning', 'btn-success');
}

function eliminarUsuario(id) {
    Swal.fire({title:'¿Eliminar?', text:"Se borrará del sistema", icon:'warning', showCancelButton:true, confirmButtonText:'Sí, borrar'}).then(async (r)=>{
        if(r.isConfirmed) { await fetch(`http://localhost:5001/usuarios/${id}`, {method:'DELETE'}); listarUsuarios(); }
    });
}