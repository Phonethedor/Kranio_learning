/**
 * Valida un formulario de registro.
 * @param {Object} data - Objeto con { nombre, email, edad, password }
 * @throws {Error} - Lanza un error con mensaje específico si la validación falla.
 */
function validarRegistro(data) {
    try {
        const { nombre, email, edad, password } = data;

        // 1. Verificación de nombre (Estructura condicional simple)
        if (!nombre || nombre.trim().length === 0) {
            throw new Error("El nombre es obligatorio y no puede estar vacío.");
        }

        // 2. Verificación de Email (Uso de RegEx)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error("El formato del correo electrónico no es válido.");
        }

        // 3. Verificación de Edad (Operadores lógicos y de comparación)
        const edadNum = Number(edad);
        if (isNaN(edadNum) || edadNum < 18 || edadNum > 99) {
            throw new Error("Debes tener entre 18 y 99 años para registrarte.");
        }

        // 4. Contraseña Segura (Mínimo 8 caracteres, al menos una letra y un número)
        const passRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passRegex.test(password)) {
            throw new Error("La contraseña debe tener al menos 8 caracteres, incluir una letra y un número.");
        }

        console.log("✅ Registro exitoso para:", nombre);
        return true;

    } catch (error) {
        console.error("❌ Error de validación:", error.message);
        return false;
    }
}

// --- Pruebas de ejecución ---
validarRegistro({ nombre: "Ana", email: "ana@mail.com", edad: 25, password: "Password123" }); // Éxito
validarRegistro({ nombre: "Ana", email: "email-invalido", edad: 17, password: "123" });        // Error