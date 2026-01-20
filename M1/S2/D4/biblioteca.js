/**
 * SISTEMA INTEGRAL DE GESTIÓN DE BIBLIOTECA PRO
 * Incluye: Gestión de stock, Usuarios, Préstamos, Multas y Estadísticas.
 */

console.log("=== 📚 INICIANDO SISTEMA DE BIBLIOTECA PRO ===\n");

// 1. BASE DE DATOS INICIAL
const libros = [
    { id: 1, titulo: "JavaScript: The Good Parts", autor: "Douglas Crockford", genero: "Programación", disponible: true },
    { id: 2, titulo: "Clean Code", autor: "Robert C. Martin", genero: "Programación", disponible: false },
    { id: 3, titulo: "The Pragmatic Programmer", autor: "Andrew Hunt", genero: "Programación", disponible: true },
    { id: 4, titulo: "1984", autor: "George Orwell", genero: "Ficción", disponible: true },
    { id: 5, titulo: "To Kill a Mockingbird", autor: "Harper Lee", genero: "Ficción", disponible: false }
];

const usuarios = [
    { id: 101, nombre: "Elena Nito", historial: [] },
    {
        id: 102, nombre: "Aquiles Brinco", historial: [
            { libroId: 2, titulo: "Clean Code", fechaPrestamo: "2025-11-01", fechaEntrega: "2025-11-08" }
        ]
    }
];

// 2. MOTOR DEL SISTEMA
const biblioteca = {

    // Búsqueda avanzada con filtros dinámicos y destructuring
    buscarAvanzado({ genero, disponible, autor } = {}) {
        return libros.filter(libro => {
            const matchGenero = genero ? libro.genero === genero : true;
            const matchDisponible = disponible !== undefined ? libro.disponible === disponible : true;
            const matchAutor = autor ? libro.autor.toLowerCase().includes(autor.toLowerCase()) : true;
            return matchGenero && matchDisponible && matchAutor;
        });
    },

    // Gestión de préstamos vinculada a usuarios
    prestarAUser(libroId, usuarioId) {
        const libro = libros.find(l => l.id === libroId);
        const usuario = usuarios.find(u => u.id === usuarioId);

        if (!libro || !usuario) return { exito: false, msj: "❌ Error: ID no encontrado" };
        if (!libro.disponible) return { exito: false, msj: `❌ "${libro.titulo}" no está disponible` };

        // Lógica de fechas (7 días para entrega)
        const hoy = new Date();
        const entrega = new Date();
        entrega.setDate(hoy.getDate() + 7);

        libro.disponible = false;
        usuario.historial.push({
            libroId,
            titulo: libro.titulo,
            fechaPrestamo: hoy.toISOString().split('T')[0],
            fechaEntrega: entrega.toISOString().split('T')[0]
        });

        return { exito: true, msj: `✅ "${libro.titulo}" prestado a ${usuario.nombre}. Vence: ${usuario.historial.at(-1).fechaEntrega}` };
    },

    // Cálculo de multas basado en la fecha actual (Enero 2026)
    calcularMultas(usuarioId) {
        const hoy = new Date(); // 2026-01-20
        const MULTA_DIARIA = 2.50;
        const usuario = usuarios.find(u => u.id === usuarioId);

        if (!usuario) return "Usuario no encontrado";

        return usuario.historial
            .filter(h => new Date(h.fechaEntrega) < hoy)
            .map(({ titulo, fechaEntrega }) => {
                const diasRetraso = Math.ceil((hoy - new Date(fechaEntrega)) / (1000 * 60 * 60 * 24));
                return {
                    libro: titulo,
                    atraso: `${diasRetraso} días`,
                    multa: `${(diasRetraso * MULTA_DIARIA).toFixed(2)}€`
                };
            });
    },

    // Estadísticas y Reporte de Popularidad
    obtenerReporte() {
        const totalLibros = libros.length;
        const prestados = libros.filter(l => !l.disponible).length;

        // Ranking usando flatMap y reduce
        const popularidad = usuarios
            .flatMap(u => u.historial)
            .reduce((acc, { titulo }) => {
                acc[titulo] = (acc[titulo] || 0) + 1;
                return acc;
            }, {});

        return {
            stock: { total: totalLibros, prestados, disponibles: totalLibros - prestados },
            ranking: Object.entries(popularidad).sort(([, a], [, b]) => b - a)
        };
    }
};

// 3. EJECUCIÓN DE PRUEBAS
console.log("--- 1. Búsqueda de Libros de Programación Disponibles ---");
console.table(biblioteca.buscarAvanzado({ genero: "Programación", disponible: true }));

console.log("\n--- 2. Procesando Nuevo Préstamo ---");
const resultado = biblioteca.prestarAUser(4, 101); // 1984 a Elena
console.log(resultado.msj);

console.log("\n--- 3. Estado de Multas de Usuarios ---");
usuarios.forEach(u => {
    const multas = biblioteca.calcularMultas(u.id);
    if (multas.length > 0) {
        console.log(`⚠️ Multas para ${u.nombre}:`);
        console.table(multas);
    } else {
        console.log(`✨ ${u.nombre} no tiene multas pendientes.`);
    }
});

console.log("\n--- 4. Reporte Final de Operaciones ---");
const reporte = biblioteca.obtenerReporte();
console.log("Resumen de Stock:", reporte.stock);
console.log("Ranking de Popularidad (veces prestado):", reporte.ranking);