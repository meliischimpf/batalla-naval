// Clase Barco para representar los barcos en el juego
class Barco {
    constructor(tipo, longitud) {
        this.tipo = tipo;
        this.longitud = longitud;
    }
}

// Clase Tablero para gestionar el tablero del juego
class Tablero {
    constructor(filas, columnas) {
        this.filas = filas;
        this.columnas = columnas;
        this.barcosPosiciones = []; // Array para almacenar las posiciones de los barcos
    }

    // Método para crear el tablero y los botones
    crearTablero() {
        const letras = "ABCDEFGHIJ";
        const tablero = document.getElementById("tablero");
        tablero.innerHTML = "";

        for (let i = 0; i < this.filas; i++) { 
            let fila = document.createElement("div");
            fila.classList.add("fila");

            for (let j = 0; j < this.columnas; j++) { 
                let boton = document.createElement("button");
                boton.textContent = `${letras[j]}${i + 1}`; 
                boton.id = `posicion-${i}-${j}`; // ID corresponde a la posición en el array
                boton.classList.add("boton");
                fila.appendChild(boton);
            }

            tablero.appendChild(fila);
        }
    }

    // Método para asignar un barco a una posición aleatoria en el tablero
    asignarBarco(barco) {
        let direccion = Math.random() < 0.5 ? "horizontal" : "vertical";
        let posiciones = [];
        let intentos = 0;

        while (intentos < 100) { // limito a 100 porque si no se rompe todo (no es q me haya pasado)
            let fila = Math.floor(Math.random() * this.filas); 
            let columna = Math.floor(Math.random() * this.columnas); 
            posiciones = [];
            let valido = true; // se comprueba posición válida con este valor

            for (let i = 0; i < barco.longitud; i++) {
                let nuevaFila = direccion === "vertical" ? fila + i : fila; 
                let nuevaColumna = direccion === "horizontal" ? columna + i : columna;

                if (nuevaFila >= this.filas || nuevaColumna >= this.columnas) {
                    valido = false; // posición inválida
                    break;
                }

                // comprobamos si la posición está ocupada por otro barco
                if (this.estaOcupado(nuevaFila, nuevaColumna)) {
                    valido = false; // posición inválida
                    break;
                }

                posiciones.push([nuevaFila, nuevaColumna]);
            }

            if (valido && posiciones.length === barco.longitud) {
                this.barcosPosiciones.push(posiciones);
                console.log(`Barco ${barco.tipo} asignado en: ${JSON.stringify(posiciones)}`);
                break; // salimos del bucle si se asigna el barco correctamente
            }

            intentos++;
        }

        if (intentos === 100) {
            console.log(`No se pudo asignar el barco ${barco.tipo} después de 100 intentos.`);
        }
    }

    estaOcupado(fila, columna) { // lo dice el nombre cheee
        for (let i = 0; i < this.barcosPosiciones.length; i++) {
            let barco = this.barcosPosiciones[i];
            for (let j = 0; j < barco.length; j++) {
                if (barco[j][0] === fila && barco[j][1] === columna) {
                    return true; // true si la posición está ocupada
                }
            }
        }
        return false; // false si la posición está libre
    }

    // Método para atacar una posición en el tablero 
    // devuelve valores que maneja functions.js ;)
    atacarPosicion(fila, columna) {
        for (let i = 0; i < this.barcosPosiciones.length; i++) {
            let barco = this.barcosPosiciones[i];
            for (let j = 0; j < barco.length; j++) {
                if (barco[j][0] === fila && barco[j][1] === columna) {
                    barco.splice(j, 1);
                    if (barco.length === 0) {
                        return "Hundido";
                    }
                    return "Tocado";
                }
            }
        }
        return "Agua";
    }
}
