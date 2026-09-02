// ============================================
// CONFIGURACIÓN DE MAKE.COM - VERSIÓN ACTUALIZADA
// ============================================

// ============================================
// CONFIGURACIÓN DE MAKE.COM
// ============================================

// ⚠️ IMPORTANTE: Cambia esta URL por la de tu webhook de Make.com
// No uses make.com directamente, usa la URL completa de tu webhook
const URL_BASE = 'https://hook.us2.make.com';// ¡CAMBIA ESTO!

// ⚠️ IMPORTANTE: Cada operación DEBE tener su propio webhook en Make.com
// Por ahora, TODOS usan el mismo (el que creaste para guardar)
const ENDPOINTS = {
    guardar: '/ohogx0u23kouxlxl7d6jvnrroe0ggc4x',  // ¡Este es tu path!
    citas: '/img1teeidv184ikhyno968la0ib18rbw',    // Temporalmente igual
    cita: '/ohogx0u23kouxlxl7d6jvnrroe0ggc4x',     // Temporalmente igual
    editar: '/ohogx0u23kouxlxl7d6jvnrroe0ggc4x',   // Temporalmente igual
    completar: '/ohogx0u23kouxlxl7d6jvnrroe0ggc4x',// Temporalmente igual
    cancelar: '/ohogx0u23kouxlxl7d6jvnrroe0ggc4x'  // Temporalmente igual
};

// ============================================
// FUNCIÓN PARA HACER FETCH CON MANEJO DE CORS
// ============================================
async function hacerPeticion(endpoint, options = {}) {
    const url = `${URL_BASE}${endpoint}`;
    
    // Configuración por defecto para evitar CORS
    const config = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        ...options
    };

    // Si hay body, convertirlo a JSON
    if (options.body) {
        config.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(url, config);
        
        // Intentar parsear como JSON, si falla, usar texto plano
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            // Si es texto plano pero la respuesta es exitosa, crear objeto éxito
            if (response.ok) {
                data = { exito: true, mensaje: text || 'Operación exitosa' };
            } else {
                data = { exito: false, mensaje: text || 'Error en la operación' };
            }
        }

        return {
            ok: response.ok,
            status: response.status,
            data: data
        };

    } catch (error) {
        console.error('Error en petición:', error);
        // Si el error es por CORS o red, devolver un objeto de error manejable
        return {
            ok: false,
            status: 0,
            data: { 
                exito: false, 
                mensaje: 'Error de conexión. Verifica que Make.com esté accesible.'
            },
            error: error
        };
    }
}

// ============================================
// CARGAR AGENDA (VERSIÓN MEJORADA)
// ============================================
async function cargarAgenda() {
    try {
        const hoy = new Date();
        const diaSemana = hoy.getDay();
        const diff = hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
        const lunes = new Date(hoy);
        lunes.setDate(diff);
        
        const domingo = new Date(lunes);
        domingo.setDate(lunes.getDate() + 6);
        
        const fechaInicio = formatearFecha(lunes);
        const fechaFin = formatearFecha(domingo);
        
        // Usar la función mejorada
        const resultado = await hacerPeticion(
            `${ENDPOINTS.citas}?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
        );
        
        if (resultado.ok) {
            const citas = resultado.data.citas || resultado.data || [];
            mostrarAgenda(citas, lunes);
        } else {
            // Si falla, mostrar mensaje amigable pero NO romper el flujo
            console.warn('No se pudo cargar la agenda:', resultado.data.mensaje);
            document.getElementById('agenda-container').innerHTML = `
                <div class="col-12">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i> 
                        No se pudo cargar la agenda. <strong>Pero puedes seguir agregando citas.</strong>
                        <br><small>Error: ${resultado.data.mensaje || 'Desconocido'}</small>
                    </div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error en cargarAgenda:', error);
        // Mostrar error pero NO romper el flujo
        document.getElementById('agenda-container').innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Error al cargar la agenda. <strong>Puedes seguir agregando citas.</strong>
                </div>
            </div>
        `;
    }
}

// ============================================
// MOSTRAR AGENDA CON BOTONES DE ACCIÓN
// ============================================
function mostrarAgenda(citas, lunes) {
    const container = document.getElementById('agenda-container');
    container.innerHTML = '';
    
    // Si no hay citas o es null, mostrar mensaje
    if (!citas || citas.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> 
                    No hay citas para esta semana.
                </div>
            </div>
        `;
        return;
    }
    
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const hoy = new Date();
    
    dias.forEach((nombreDia, index) => {
        const fecha = new Date(lunes);
        fecha.setDate(lunes.getDate() + index);
        const fechaStr = formatearFecha(fecha);
        
        const citasDia = citas.filter(c => c.fecha === fechaStr);
        const esHoy = formatearFecha(hoy) === fechaStr;
        
        const columna = document.createElement('div');
        columna.className = 'col-md-4 col-lg-3 mb-4';
        
        columna.innerHTML = `
            <div class="dia-column">
                <div class="dia-nombre ${esHoy ? 'border border-warning border-3' : ''}">
                    <strong>${nombreDia}</strong>
                    <br>
                    <small>${fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</small>
                    <span class="badge">${citasDia.length}</span>
                    ${esHoy ? '<br><span class="badge-hoy">🔥 HOY</span>' : ''}
                </div>
                
                ${citasDia.length === 0 ? `
                    <p class="text-muted text-center mt-3">
                        <i class="fas fa-calendar-day"></i><br>Sin citas
                    </p>
                ` : ''}
                
                ${citasDia.map(c => `
                    <div class="cita-card estado-${c.estado ? c.estado.toLowerCase().replace(' ', '-') : 'confirmada'}" id="cita-${c.id_cita}">
                        <div class="hora"><i class="fas fa-clock"></i> ${c.hora}</div>
                        <div class="cliente"><i class="fas fa-user"></i> ${c.nombre_cliente}</div>
                        <div class="telefono"><i class="fas fa-phone"></i> ${c.telefono}</div>
                        <div class="servicio"><i class="fas fa-cut"></i> ${c.servicio}</div>
                        <div class="estado mt-1">
                            ${c.estado === 'Confirmada' ? '<span class="badge bg-success"><i class="fas fa-check"></i> Confirmada</span>' : ''}
                            ${c.estado === 'Completada' ? '<span class="badge bg-info"><i class="fas fa-check-double"></i> Completada</span>' : ''}
                            ${c.estado === 'Cancelada' ? '<span class="badge bg-danger"><i class="fas fa-times"></i> Cancelada</span>' : ''}
                            ${c.estado === 'No Asistió' ? '<span class="badge bg-warning text-dark"><i class="fas fa-clock"></i> No Asistió</span>' : ''}
                        </div>
                        
                        <!-- BOTONES DE ACCIÓN -->
                        <div class="acciones">
                            <button class="btn btn-sm btn-warning" onclick="editarCita(${c.id_cita})" title="Editar cita">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn btn-sm btn-success" onclick="completarCita(${c.id_cita})" title="Marcar como completada">
                                <i class="fas fa-check"></i> Completar
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="cancelarCita(${c.id_cita})" title="Cancelar cita">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.appendChild(columna);
    });
}

// ============================================
// GUARDAR NUEVA CITA (CORREGIDO)
// ============================================
document.getElementById('form-cita').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const cita = {
        fecha: document.getElementById('fecha').value,
        hora: document.getElementById('hora').value,
        nombre_cliente: document.getElementById('nombre').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        servicio: document.getElementById('servicio').value,
        estado: "Confirmada"
    };
    
    // Validaciones
    if (!cita.fecha || !cita.hora || !cita.nombre_cliente || !cita.telefono || !cita.servicio) {
        mostrarMensaje('⚠️ Todos los campos son obligatorios', 'warning');
        return;
    }
    
    // Validar horario (9:00 - 20:00)
    const [h, m] = cita.hora.split(':').map(Number);
    if (h < 9 || h >= 20) {
        mostrarMensaje('⚠️ Horario fuera de atención (9:00 - 20:00)', 'warning');
        return;
    }
    
    const boton = this.querySelector('button[type="submit"]');
    boton.disabled = true;
    boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    
    try {
        // Usar la función mejorada
        const resultado = await hacerPeticion(ENDPOINTS.guardar, {
            method: 'POST',
            body: cita
        });
        
        if (resultado.ok && resultado.data.exito !== false) {
            mostrarMensaje('✅ ¡Cita guardada con éxito!', 'success');
            this.reset();
            
            // ⚠️ TEMPORALMENTE COMENTADO: cargarAgenda();
            // Descomentar cuando tengas el webhook de consulta configurado
            cargarAgenda();
            
            // Mostrar mensaje de que la cita se guardó pero no se actualiza la agenda
            setTimeout(() => {
                mostrarMensaje('💡 Recuerda: La agenda se actualizará cuando configures el webhook de consulta', 'info');
            }, 3000);
            
        } else {
            const mensaje = resultado.data?.mensaje || 'Error al guardar';
            mostrarMensaje(`❌ ${mensaje}`, 'danger');
        }
        
    } catch (error) {
        console.error('Error al guardar:', error);
        mostrarMensaje('❌ Error al guardar la cita. Verifica que Make.com esté funcionando.', 'danger');
    } finally {
        boton.disabled = false;
        boton.innerHTML = '<i class="fas fa-save"></i> Guardar Cita';
    }
});

// ============================================
// EDITAR CITA - Abrir Modal
// ============================================
async function editarCita(idCita) {
    try {
        const resultado = await hacerPeticion(`${ENDPOINTS.cita}?id=${idCita}`);
        
        if (!resultado.ok) {
            mostrarMensaje('❌ Error al cargar la cita', 'danger');
            return;
        }
        
        const cita = resultado.data;
        
        document.getElementById('edit-id').value = cita.id_cita || idCita;
        document.getElementById('edit-fecha').value = cita.fecha || '';
        document.getElementById('edit-hora').value = cita.hora || '';
        document.getElementById('edit-nombre').value = cita.nombre_cliente || '';
        document.getElementById('edit-telefono').value = cita.telefono || '';
        document.getElementById('edit-servicio').value = cita.servicio || '';
        document.getElementById('edit-estado').value = cita.estado || 'Confirmada';
        
        const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
        modal.show();
        
    } catch (error) {
        console.error('Error al editar:', error);
        mostrarMensaje('❌ Error al cargar la cita para editar', 'danger');
    }
}

// ============================================
// GUARDAR EDICIÓN
// ============================================
async function guardarEdicion() {
    const id = document.getElementById('edit-id').value;
    
    const citaActualizada = {
        id: id,
        fecha: document.getElementById('edit-fecha').value,
        hora: document.getElementById('edit-hora').value,
        nombre_cliente: document.getElementById('edit-nombre').value.trim(),
        telefono: document.getElementById('edit-telefono').value.trim(),
        servicio: document.getElementById('edit-servicio').value,
        estado: document.getElementById('edit-estado').value
    };
    
    // Validar horario
    const [h, m] = citaActualizada.hora.split(':').map(Number);
    if (h < 9 || h >= 20) {
        mostrarMensaje('⚠️ Horario fuera de atención (9:00 - 20:00)', 'warning');
        return;
    }
    
    try {
        const resultado = await hacerPeticion(ENDPOINTS.editar, {
            method: 'PUT',
            body: citaActualizada
        });
        
        if (resultado.ok && resultado.data.exito !== false) {
            mostrarMensaje(`✅ Cita #${id} actualizada`, 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditar'));
            modal.hide();
            // cargarAgenda(); // Descomentar cuando funcione
        } else {
            mostrarMensaje(`❌ ${resultado.data?.mensaje || 'Error al actualizar'}`, 'danger');
        }
        
    } catch (error) {
        console.error('Error al actualizar:', error);
        mostrarMensaje('❌ Error al actualizar la cita', 'danger');
    }
}

// ============================================
// COMPLETAR CITA
// ============================================
async function completarCita(idCita) {
    if (!confirm(`¿Confirmar que la cita #${idCita} se completó?`)) {
        return;
    }
    
    try {
        const resultado = await hacerPeticion(ENDPOINTS.completar, {
            method: 'PUT',
            body: { 
                id: idCita,
                estado: 'Completada'
            }
        });
        
        if (resultado.ok && resultado.data.exito !== false) {
            mostrarMensaje(`✅ Cita #${idCita} completada`, 'success');
            // cargarAgenda(); // Descomentar cuando funcione
        } else {
            mostrarMensaje(`❌ ${resultado.data?.mensaje || 'Error al completar'}`, 'danger');
        }
        
    } catch (error) {
        console.error('Error al completar:', error);
        mostrarMensaje('❌ Error al completar la cita', 'danger');
    }
}

// ============================================
// CANCELAR CITA
// ============================================
async function cancelarCita(idCita) {
    if (!confirm(`¿Estás seguro de cancelar la cita #${idCita}?`)) {
        return;
    }
    
    try {
        const resultado = await hacerPeticion(ENDPOINTS.cancelar, {
            method: 'PUT',
            body: { 
                id: idCita,
                estado: 'Cancelada'
            }
        });
        
        if (resultado.ok && resultado.data.exito !== false) {
            mostrarMensaje(`✅ Cita #${idCita} cancelada`, 'success');
            // cargarAgenda(); // Descomentar cuando funcione
        } else {
            mostrarMensaje(`❌ ${resultado.data?.mensaje || 'Error al cancelar'}`, 'danger');
        }
        
    } catch (error) {
        console.error('Error al cancelar:', error);
        mostrarMensaje('❌ Error al cancelar la cita', 'danger');
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

// Formatear fecha para Google Sheets (YYYY-MM-DD)
function formatearFecha(fecha) {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Mostrar mensajes
function mostrarMensaje(texto, tipo) {
    const div = document.getElementById('mensaje');
    div.className = `alert alert-${tipo}`;
    div.innerHTML = texto;
    div.style.display = 'block';
    
    clearTimeout(div._timeout);
    div._timeout = setTimeout(() => {
        div.style.display = 'none';
    }, 5000);
}

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Cargar agenda (si falla, no rompe el sistema)
    cargarAgenda();
    
    // Configurar fechas mínima y máxima
    const inputFecha = document.getElementById('fecha');
    const hoy = new Date();
    const maxFecha = new Date(hoy);
    maxFecha.setDate(hoy.getDate() + 7);
    
    inputFecha.min = formatearFecha(hoy);
    inputFecha.max = formatearFecha(maxFecha);
    inputFecha.value = formatearFecha(hoy);
});