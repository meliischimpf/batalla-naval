// Flota clásica del juego de mesa (17 casillas)
const FLOTA = [
    { tipo: "Portaaviones", longitud: 5 },
    { tipo: "Buque", longitud: 4 },
    { tipo: "Submarino", longitud: 3 },
    { tipo: "Crucero", longitud: 3 },
    { tipo: "Lancha", longitud: 2 }
];

// Clase Barco para representar los barcos en el juego
class Barco {
    constructor(tipo, longitud) {
        this.tipo = tipo;
        this.longitud = longitud;
        this.celdas = [];          // [[fila, columna], ...] — vacío mientras no esté ubicado
        this.direccion = "horizontal";
        this.impactos = new Set(); // claves "fila,columna" de las celdas tocadas
    }

    get ubicado() {
        return this.celdas.length > 0;
    }

    get hundido() {
        return this.ubicado && this.impactos.size === this.longitud;
    }
}

// Clase Tablero para gestionar la lógica del tablero (sin DOM)
class Tablero {
    constructor(filas = 10, columnas = 10) {
        this.filas = filas;
        this.columnas = columnas;
        this.barcos = [];
        this.disparos = new Map(); // "fila,columna" -> resultado
    }

    static celdasDe(longitud, fila, columna, direccion) {
        return Array.from({ length: longitud }, (_, i) =>
            direccion === "vertical" ? [fila + i, columna] : [fila, columna + i]
        );
    }

    dentro(fila, columna) {
        return fila >= 0 && fila < this.filas && columna >= 0 && columna < this.columnas;
    }

    barcoEn(fila, columna) {
        return this.barcos.find(barco =>
            barco.celdas.some(([f, c]) => f === fila && c === columna)
        ) || null;
    }

    // Las 8 casillas que rodean a una (las que quedan fuera del tablero se descartan)
    vecinas(fila, columna) {
        const vecinas = [];
        for (let df = -1; df <= 1; df++) {
            for (let dc = -1; dc <= 1; dc++) {
                if ((df || dc) && this.dentro(fila + df, columna + dc)) vecinas.push([fila + df, columna + dc]);
            }
        }
        return vecinas;
    }

    // Los barcos no pueden superponerse ni tocarse, tampoco en diagonal.
    // `ignorar` permite mover un barco ya ubicado sin que choque consigo mismo
    puedeUbicar(longitud, fila, columna, direccion, ignorar = null) {
        const libre = ([f, c]) => {
            const ocupante = this.barcoEn(f, c);
            return !ocupante || ocupante === ignorar;
        };
        return Tablero.celdasDe(longitud, fila, columna, direccion).every(([f, c]) =>
            this.dentro(f, c) && libre([f, c]) && this.vecinas(f, c).every(libre)
        );
    }

    // Casillas alrededor de un barco hundido: seguro son agua
    alrededorDe(barco) {
        const claves = new Set(barco.celdas.map(([f, c]) => `${f},${c}`));
        const alrededor = new Map();
        barco.celdas.forEach(([f, c]) => this.vecinas(f, c).forEach(([x, y]) => {
            if (!claves.has(`${x},${y}`)) alrededor.set(`${x},${y}`, [x, y]);
        }));
        return [...alrededor.values()];
    }

    ubicar(barco, fila, columna, direccion) {
        if (!this.puedeUbicar(barco.longitud, fila, columna, direccion, barco)) return false;

        barco.celdas = Tablero.celdasDe(barco.longitud, fila, columna, direccion);
        barco.direccion = direccion;
        if (!this.barcos.includes(barco)) this.barcos.push(barco);
        return true;
    }

    quitar(barco) {
        this.barcos = this.barcos.filter(b => b !== barco);
        barco.celdas = [];
    }

    // Elige al azar entre TODAS las posiciones válidas, así nunca se queda sin lugar
    // (antes se probaban posiciones al azar con un límite de intentos y a veces fallaba)
    ubicarAleatorio(barco) {
        const opciones = [];
        for (const direccion of ["horizontal", "vertical"]) {
            for (let f = 0; f < this.filas; f++) {
                for (let c = 0; c < this.columnas; c++) {
                    if (this.puedeUbicar(barco.longitud, f, c, direccion, barco)) {
                        opciones.push([f, c, direccion]);
                    }
                }
            }
        }
        if (opciones.length === 0) return false;

        const [f, c, direccion] = opciones[Math.floor(Math.random() * opciones.length)];
        return this.ubicar(barco, f, c, direccion);
    }

    ubicarFlotaAleatoria(barcos) {
        // del más grande al más chico, para que los grandes no se queden sin espacio;
        // si igual alguno no entra (los barcos no pueden tocarse), se reintenta con toda la flota
        const ordenados = [...barcos].sort((a, b) => b.longitud - a.longitud);
        do {
            barcos.forEach(barco => this.quitar(barco));
        } while (!ordenados.every(barco => this.ubicarAleatorio(barco)));
    }

    // Devuelve { resultado: "Agua" | "Tocado" | "Hundido" | "Repetido", barco }
    atacar(fila, columna) {
        const clave = `${fila},${columna}`;
        if (this.disparos.has(clave)) return { resultado: "Repetido", barco: null };

        const barco = this.barcoEn(fila, columna);
        let resultado = "Agua";
        if (barco) {
            barco.impactos.add(clave);
            resultado = barco.hundido ? "Hundido" : "Tocado";
        }
        this.disparos.set(clave, resultado);
        return { resultado, barco };
    }

    // null si no se disparó ahí; si no, "agua", "tocado" o "hundido" según el estado actual del barco
    estadoCelda(fila, columna) {
        if (!this.disparos.has(`${fila},${columna}`)) return null;
        const barco = this.barcoEn(fila, columna);
        if (!barco) return "agua";
        return barco.hundido ? "hundido" : "tocado";
    }

    get barcosRestantes() {
        return this.barcos.filter(barco => !barco.hundido).length;
    }

    todosHundidos() {
        return this.barcos.length > 0 && this.barcos.every(barco => barco.hundido);
    }
}
