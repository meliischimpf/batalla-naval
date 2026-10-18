// IA rival. No ve el tablero del jugador: solo conoce el resultado de sus propios disparos.
//
// - Fácil:   dispara al azar.
// - Medio:   "caza y remata". Caza en patrón de tablero de ajedrez y, cuando toca un barco,
//            prueba las casillas vecinas siguiendo la línea de los impactos.
// - Difícil: mapa de densidad de probabilidad. Para cada barco que falta hundir cuenta de
//            cuántas maneras podría estar ubicado sobre cada casilla y dispara a la más probable.

const DIFICULTADES = { facil: "Fácil", medio: "Medio", dificil: "Difícil" };

class IA {
    constructor(dificultad, filas = 10, columnas = 10, longitudes = FLOTA.map(b => b.longitud)) {
        this.dificultad = dificultad;
        this.filas = filas;
        this.columnas = columnas;
        this.restantes = [...longitudes]; // longitudes de los barcos que todavía no hundió
        // "?" desconocido, "A" agua, "T" tocado (barco sin hundir), "H" hundido
        this.estado = Array.from({ length: filas }, () => Array(columnas).fill("?"));
        this.disparos = new Set(); // "fila,columna" donde ya disparó
    }

    registrar(fila, columna, resultado, barco) {
        this.disparos.add(`${fila},${columna}`);
        if (resultado === "Agua") {
            this.estado[fila][columna] = "A";
        } else if (resultado === "Tocado") {
            this.estado[fila][columna] = "T";
            // los barcos son rectos y no se tocan, así que las diagonales de un impacto son agua
            this.vecinas(fila, columna).forEach(([x, y]) => {
                if (x !== fila && y !== columna && this.estado[x][y] === "?") this.estado[x][y] = "A";
            });
        } else if (resultado === "Hundido") {
            barco.celdas.forEach(([f, c]) => this.estado[f][c] = "H");
            this.restantes.splice(this.restantes.indexOf(barco.longitud), 1);
            // como los barcos no se tocan, todo lo que rodea a uno hundido es agua
            barco.celdas.forEach(([f, c]) => this.vecinas(f, c).forEach(([x, y]) => {
                if (this.estado[x][y] === "?") this.estado[x][y] = "A";
            }));
        }
    }

    vecinas(fila, columna) {
        const vecinas = [];
        for (let df = -1; df <= 1; df++) {
            for (let dc = -1; dc <= 1; dc++) {
                const [x, y] = [fila + df, columna + dc];
                if ((df || dc) && x >= 0 && y >= 0 && x < this.filas && y < this.columnas) vecinas.push([x, y]);
            }
        }
        return vecinas;
    }

    celdasCon(marca) {
        const celdas = [];
        for (let f = 0; f < this.filas; f++) {
            for (let c = 0; c < this.columnas; c++) {
                if (this.estado[f][c] === marca) celdas.push([f, c]);
            }
        }
        return celdas;
    }

    // Matriz con el "peso" de cada casilla desconocida. Si hay impactos sin resolver, solo cuentan
    // las ubicaciones que pasan por ellos, y pesan mucho más cuantos más impactos atraviesan.
    mapaProbabilidad() {
        const mapa = Array.from({ length: this.filas }, () => Array(this.columnas).fill(0));
        const hayTocados = this.celdasCon("T").length > 0;

        for (const longitud of this.restantes) {
            for (const direccion of ["horizontal", "vertical"]) {
                for (let f = 0; f < this.filas; f++) {
                    for (let c = 0; c < this.columnas; c++) {
                        const celdas = Tablero.celdasDe(longitud, f, c, direccion);
                        const cabe = celdas.every(([x, y]) =>
                            x < this.filas && y < this.columnas &&
                            (this.estado[x][y] === "?" || this.estado[x][y] === "T")
                        );
                        if (!cabe) continue;

                        const tocados = celdas.filter(([x, y]) => this.estado[x][y] === "T").length;
                        if (hayTocados && tocados === 0) continue;

                        const peso = 10 ** tocados;
                        celdas.forEach(([x, y]) => {
                            if (this.estado[x][y] === "?") mapa[x][y] += peso;
                        });
                    }
                }
            }
        }
        return mapa;
    }

    elegirDisparo() {
        const desconocidas = this.celdasCon("?");
        if (this.dificultad === "facil") {
            // no deduce nada: cualquier casilla donde todavía no disparó
            const libres = [];
            for (let f = 0; f < this.filas; f++) {
                for (let c = 0; c < this.columnas; c++) {
                    if (!this.disparos.has(`${f},${c}`)) libres.push([f, c]);
                }
            }
            return azar(libres);
        }
        if (this.dificultad === "medio") return this.cazarYRematar(desconocidas);
        return this.masProbable(this.mapaProbabilidad(), desconocidas);
    }

    cazarYRematar(desconocidas) {
        const tocados = this.celdasCon("T");

        if (tocados.length > 0) {
            const mismaFila = tocados.every(([f]) => f === tocados[0][0]);
            const mismaColumna = tocados.every(([, c]) => c === tocados[0][1]);
            const vecinas = [];

            tocados.forEach(([f, c]) => {
                [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([df, dc]) => {
                    const [x, y] = [f + df, c + dc];
                    if (x < 0 || y < 0 || x >= this.filas || y >= this.columnas) return;
                    if (this.estado[x][y] !== "?") return;
                    vecinas.push({ celda: [x, y], enLinea: df === 0 ? mismaFila : mismaColumna });
                });
            });

            // con dos o más impactos alineados, sigue esa línea
            const enLinea = tocados.length >= 2 ? vecinas.filter(v => v.enLinea) : vecinas;
            const candidatas = (enLinea.length ? enLinea : vecinas).map(v => v.celda);
            if (candidatas.length) return azar(candidatas);
        }

        // Caza: el barco más chico que queda ocupa al menos `min` casillas,
        // así que alcanza con mirar una de cada `min` en diagonal
        const min = Math.min(...this.restantes);
        const patron = desconocidas.filter(([f, c]) => (f + c) % min === 0);
        return azar(patron.length ? patron : desconocidas);
    }

    masProbable(mapa, desconocidas) {
        const max = Math.max(...desconocidas.map(([f, c]) => mapa[f][c]));
        if (max === 0) return azar(desconocidas);
        return azar(desconocidas.filter(([f, c]) => mapa[f][c] === max));
    }
}

function azar(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
}
