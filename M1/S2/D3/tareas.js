const crearGestionTareas = () => {
    // Estado privado: no es accesible desde fuera del closure
    let tareas = [];
    let idCounter = 1;

    return {
        // Agregar tarea con parámetros por defecto
        agregarTarea: (descripcion, prioridad = 'media') => {
            const nuevaTarea = {
                id: idCounter++,
                descripcion,
                prioridad,
                completada: false,
                fecha: new Date().toLocaleDateString()
            };
            tareas.push(nuevaTarea);
            return `Tarea "${descripcion}" agregada.`;
        },

        // Marcar como completada usando búsqueda por ID
        completarTarea: (id) => {
            const tarea = tareas.find(t => t.id === id);
            if (tarea) {
                tarea.completada = true;
                return `Tarea ${id} marcada como completada.`;
            }
            return "Tarea no encontrada.";
        },

        // Filtrar usando Arrow Functions y parámetros avanzados
        filtrarTareas: (filtro = 'todas') => {
            if (filtro === 'completadas') return tareas.filter(t => t.completada);
            if (filtro === 'pendientes') return tareas.filter(t => !t.completada);
            return [...tareas]; // Retorna una copia para evitar mutaciones externas
        },

        // Obtener estadísticas usando reduce
        obtenerEstadisticas: () => {
            const total = tareas.length;
            const completadas = tareas.reduce((acc, t) => t.completada ? acc + 1 : acc, 0);
            return {
                total,
                completadas,
                pendientes: total - completadas,
                porcentajeExito: total > 0 ? `${(completadas / total * 100).toFixed(2)}%` : '0%'
            };
        }
    };
};

// --- Uso del sistema ---
const miLista = crearGestionTareas();
miLista.agregarTarea("Aprender Closures", "alta");
miLista.agregarTarea("Configurar Git", "media");
miLista.completarTarea(1);

console.table(miLista.filtrarTareas('todas'));
console.log("Estadísticas:", miLista.obtenerEstadisticas());