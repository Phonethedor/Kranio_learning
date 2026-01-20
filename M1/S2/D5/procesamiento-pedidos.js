const fs = require('fs');
const path = require('path');

// ==========================================
// 1. CONFIGURACIÓN Y MOCK API
// ==========================================

const DB_PATH = path.join(__dirname, 'datos_locales.json');
const TIMEOUT_MS = 2000;   // Tiempo máximo de espera por petición
const MAX_RETRIES = 3;     // Intentos de reconexión

// Simulación de API inestable (fallos aleatorios y latencia)
const api = {
    _randomDelay: () => Math.floor(Math.random() * 1000) + 500, // 500ms - 1500ms
    _shouldFail: () => Math.random() < 0.3, // 30% probabilidad de fallo

    // Endpoint 1: Obtener usuarios
    getUsers: function (callback) {
        setTimeout(() => {
            if (this._shouldFail()) {
                callback(new Error("[API] Error 500: Fallo en servidor de usuarios"), null);
            } else {
                callback(null, [
                    { id: 1, nombre: "Ana", role: "admin" },
                    { id: 2, nombre: "Carlos", role: "user" }
                ]);
            }
        }, this._randomDelay());
    },

    // Endpoint 2: Obtener transacciones
    getTransactions: function (callback) {
        setTimeout(() => {
            if (this._shouldFail()) {
                callback(new Error("[API] Error 503: Servicio de pagos no disponible"), null);
            } else {
                callback(null, [
                    { id: 101, userId: 1, monto: 50 },
                    { id: 102, userId: 2, monto: 120 }
                ]);
            }
        }, this._randomDelay());
    },

    // Versiones Promise de los mismos métodos para Async/Await y Promises
    getUsersPromise: function () {
        return new Promise((resolve, reject) => {
            this.getUsers((err, data) => err ? reject(err) : resolve(data));
        });
    },

    getTransactionsPromise: function () {
        return new Promise((resolve, reject) => {
            this.getTransactions((err, data) => err ? reject(err) : resolve(data));
        });
    }
};

// Logger con timestamp
const log = (tag, msg) => console.log(`[${new Date().toISOString().slice(11, 19)}] [${tag}] ${msg}`);

// ==========================================
// 2. IMPLEMENTACIÓN: CALLBACKS (El "Callback Hell")
// ==========================================

function syncWithCallbacks(finalCallback) {
    log("CALLBACK", "Iniciando sincronización...");

    // Utilidad de reintento para callbacks
    function retry(fn, retriesLeft, cb) {
        // Wrapper para timeout
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            if (retriesLeft > 0) {
                log("CALLBACK", `Timeout. Reintentando... (${retriesLeft} restantes)`);
                retry(fn, retriesLeft - 1, cb);
            } else {
                cb(new Error("Timeout y reintentos agotados"));
            }
        }, TIMEOUT_MS);

        fn((err, data) => {
            if (timedOut) return; // Si ya expiró el tiempo, ignorar respuesta tardía
            clearTimeout(timer);

            if (err) {
                if (retriesLeft > 0) {
                    log("CALLBACK", `Error: ${err.message}. Reintentando...`);
                    setTimeout(() => retry(fn, retriesLeft - 1, cb), 1000);
                } else {
                    cb(err);
                }
            } else {
                cb(null, data);
            }
        });
    }

    // 1. Descargar Usuarios
    retry(api.getUsers.bind(api), MAX_RETRIES, (err, users) => {
        if (err) return finalCallback(err);
        log("CALLBACK", `Usuarios recibidos: ${users.length}`);

        // 2. Descargar Transacciones (Anidado)
        retry(api.getTransactions.bind(api), MAX_RETRIES, (err, txs) => {
            if (err) return finalCallback(err);
            log("CALLBACK", `Transacciones recibidas: ${txs.length}`);

            // 3. Procesar y Guardar (Anidado)
            const db = { timestamp: Date.now(), users, transactions: txs };
            fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), (err) => {
                if (err) return finalCallback(err);
                log("CALLBACK", "Datos guardados en disco.");
                finalCallback(null, "Éxito total");
            });
        });
    });
}

// ==========================================
// 3. IMPLEMENTACIÓN: PROMISES
// ==========================================

const wait = (ms) => new Promise(r => setTimeout(r, ms));

// Wrapper: Ejecuta promesa con Timeout y Reintentos
function braveFetch(promiseFn, context) {
    return new Promise((resolve, reject) => {

        function tryAttempt(attemptsLeft) {
            // Lógica de timeout usando Promise.race
            const timeoutPromise = new Promise((_, rej) =>
                setTimeout(() => rej(new Error("Timeout")), TIMEOUT_MS)
            );

            Promise.race([promiseFn(), timeoutPromise])
                .then(resolve)
                .catch(err => {
                    if (attemptsLeft <= 0) {
                        reject(err);
                    } else {
                        log("PROMISE", `Fallo en ${context} (${err.message}). Intento ${MAX_RETRIES - attemptsLeft + 1}...`);
                        setTimeout(() => tryAttempt(attemptsLeft - 1), 1000);
                    }
                });
        }
        tryAttempt(MAX_RETRIES);
    });
}

function syncWithPromises() {
    log("PROMISE", "Iniciando sincronización...");
    let tempDb = {};

    return braveFetch(() => api.getUsersPromise(), "Usuarios")
        .then(users => {
            log("PROMISE", `Usuarios recibidos: ${users.length}`);
            tempDb.users = users;
            // Encadenamiento lineal
            return braveFetch(() => api.getTransactionsPromise(), "Transacciones");
        })
        .then(txs => {
            log("PROMISE", `Transacciones recibidas: ${txs.length}`);
            tempDb.transactions = txs;
            tempDb.timestamp = Date.now();
            return fs.promises.writeFile(DB_PATH, JSON.stringify(tempDb, null, 2));
        })
        .then(() => {
            log("PROMISE", "Datos guardados en disco.");
            return "Éxito total";
        })
        .catch(err => {
            log("PROMISE", `Error fatal: ${err.message}`);
            throw err;
        });
}

// ==========================================
// 4. IMPLEMENTACIÓN: ASYNC / AWAIT (Moderna)
// ==========================================

async function syncWithAsyncAwait() {
    log("ASYNC", "Iniciando sincronización...");

    // Helper reutilizable dentro del scope asíncrono
    async function fetchWithRetry(fn, label) {
        for (let i = 0; i <= MAX_RETRIES; i++) {
            try {
                // Timeout manual con Promise.race
                const result = await Promise.race([
                    fn(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), TIMEOUT_MS))
                ]);
                return result;
            } catch (err) {
                if (i === MAX_RETRIES) throw err; // Si es el último intento, fallar
                log("ASYNC", `Error en ${label}: ${err.message}. Reintentando...`);
                await wait(1000); // Pausa limpia antes de reintentar
            }
        }
    }

    try {
        // Ejecución secuencial limpia (parece síncrona)
        const users = await fetchWithRetry(() => api.getUsersPromise(), "Usuarios");
        log("ASYNC", `Usuarios recibidos: ${users.length}`);

        const txs = await fetchWithRetry(() => api.getTransactionsPromise(), "Transacciones");
        log("ASYNC", `Transacciones recibidas: ${txs.length}`);

        const db = {
            timestamp: Date.now(),
            users,
            transactions: txs
        };

        await fs.promises.writeFile(DB_PATH, JSON.stringify(db, null, 2));
        log("ASYNC", "Datos guardados en disco.");
        return "Éxito total";

    } catch (error) {
        log("ASYNC", `Proceso abortado: ${error.message}`);
        throw error;
    }
}

// ==========================================
// 5. EJECUCIÓN SERIAL PARA COMPARAR
// ==========================================

log("MAIN", "=== INICIANDO PRUEBAS COMPARATIVAS ===");

// Ejecutamos una tras otra para no mezclar logs
(async () => {
    // 1. Callbacks
    console.log("\n--- TEST 1: CALLBACKS ---");
    await new Promise(resolve => {
        syncWithCallbacks((err, res) => {
            if (err) console.error("Resultado: ERROR", err.message);
            else console.log("Resultado:", res);
            resolve();
        });
    });

    // 2. Promises
    console.log("\n--- TEST 2: PROMISES ---");
    try {
        await syncWithPromises();
        console.log("Resultado: Éxito");
    } catch (e) {
        console.error("Resultado: ERROR");
    }

    // 3. Async/Await
    console.log("\n--- TEST 3: ASYNC/AWAIT ---");
    try {
        await syncWithAsyncAwait();
        console.log("Resultado: Éxito");
    } catch (e) {
        console.error("Resultado: ERROR");
    }

    console.log("\n=== PRUEBAS FINALIZADAS ===");
})();