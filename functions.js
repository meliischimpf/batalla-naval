// Variables globales
const LETRAS = "ABCDEFGHIJ";
let fase = "inicio"; // "inicio" | "ubicacion" | "batalla" | "fin"
let tableroJugador, tableroEnemigo, flotaJugador, ia;
let barcoSeleccionado = null;
let direccionUbicacion = "horizontal";
let celdaBajoCursor = null;
let turnoJugador = false;
let mostrarRadar = false;
let disparosRealizados = 0;
let impactosRealizados = 0;
let inicioBatalla = null;
let finBatalla = null;
let intervaloCronometro;
let partida = 0; // cambia en cada partida para descartar timeouts de la anterior

// Elementos del DOM (inicializados cuando el DOM esté listo)
const ui = {};

// Sistema de sonidos sintetizados con Web Audio API
class SoundManager {
    constructor() {
        this.audioContext = null;
    }

    // El navegador solo deja arrancar el audio después de una interacción del usuario,
    // así que el contexto se crea (o se reanuda) recién en el primer sonido
    contexto() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                return null;
            }
        }
        if (this.audioContext.state === "suspended") this.audioContext.resume();
        return this.audioContext;
    }

    createBeep(frequency, duration, type = 'sine', volume = 0.3) {
        const ctx = this.contexto();
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
    }

    playPlace() {
        this.createBeep(520, 0.08, 'triangle', 0.15);
    }

    playHit() {
        this.createBeep(800, 0.2, 'square');
        setTimeout(() => this.createBeep(600, 0.3, 'sawtooth'), 100);
    }

    playSink() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.createBeep(1000 - (i * 150), 0.15, 'triangle');
            }, i * 100);
        }
    }

    playMiss() {
        this.createBeep(200, 0.3, 'sine');
    }

    playGameStart() {
        const frequencies = [440, 554, 659, 880];
        frequencies.forEach((freq, i) => {
            setTimeout(() => this.createBeep(freq, 0.2, 'triangle'), i * 150);
        });
    }

    playGameWin() {
        const melody = [523, 659, 784, 1047];
        melody.forEach((freq, i) => {
            setTimeout(() => this.createBeep(freq, 0.4, 'sine'), i * 200);
        });
    }

    playGameLose() {
        const melody = [440, 392, 349, 293];
        melody.forEach((freq, i) => {
            setTimeout(() => this.createBeep(freq, 0.5, 'sawtooth'), i * 300);
        });
    }
}

const soundManager = new SoundManager();

// setTimeout que se ignora si mientras tanto empezó otra partida o se abortó
function programar(funcion, ms) {
    const esta = partida;
    setTimeout(() => {
        if (esta === partida) funcion();
    }, ms);
}

function coordenada(fila, columna) {
    return `${LETRAS[columna]}${fila + 1}`;
}

function celda(prefijo, fila, columna) {
    return document.getElementById(`${prefijo}-${fila}-${columna}`);
}

function setEstado(texto) {
    ui.estado.textContent = texto;
}

// ---------- Tableros ----------

function crearTablero(contenedor, prefijo) {
    contenedor.innerHTML = "";
    contenedor.appendChild(crearEtiqueta(""));
    for (let j = 0; j < 10; j++) contenedor.appendChild(crearEtiqueta(LETRAS[j]));

    for (let i = 0; i < 10; i++) {
        contenedor.appendChild(crearEtiqueta(i + 1));
        for (let j = 0; j < 10; j++) {
            const boton = document.createElement("button");
            boton.id = `${prefijo}-${i}-${j}`;
            boton.className = "celda";
            boton.dataset.fila = i;
            boton.dataset.columna = j;
            boton.setAttribute("aria-label", coordenada(i, j));
            contenedor.appendChild(boton);
        }
    }
}

function crearEtiqueta(texto) {
    const etiqueta = document.createElement("span");
    etiqueta.className = "etiqueta";
    etiqueta.textContent = texto;
    return etiqueta;
}

function recorrerCeldas(funcion) {
    for (let f = 0; f < 10; f++) {
        for (let c = 0; c < 10; c++) funcion(f, c);
    }
}

// Claves "fila,columna" de las casillas que rodean barcos hundidos (seguro son agua)
function aguaSegura(tablero) {
    const claves = new Set();
    tablero.barcos.filter(barco => barco.hundido)
        .forEach(barco => tablero.alrededorDe(barco).forEach(([f, c]) => claves.add(`${f},${c}`)));
    return claves;
}

function renderTableroJugador() {
    const mapa = fase === "batalla" && mostrarRadar ? ia.mapaProbabilidad() : null;
    const max = mapa ? Math.max(...mapa.flat()) : 0;
    const total = mapa ? mapa.flat().reduce((a, b) => a + b, 0) : 0;
    const segura = aguaSegura(tableroJugador);

    ui.tableroJugador.classList.toggle("interactivo", fase === "ubicacion");

    recorrerCeldas((f, c) => {
        const el = celda("jugador", f, c);
        const estado = tableroJugador.estadoCelda(f, c);

        el.classList.toggle("barco", !!tableroJugador.barcoEn(f, c));
        el.classList.toggle("agua-segura", !estado && segura.has(`${f},${c}`));
        el.classList.toggle("agua", estado === "agua");
        el.classList.toggle("tocado", estado === "tocado");
        el.classList.toggle("hundido", estado === "hundido");

        const calor = mapa && max > 0 ? mapa[f][c] / max : 0;
        el.classList.toggle("radar", calor > 0);
        el.classList.toggle("radar-max", calor === 1);
        el.style.setProperty("--calor", calor.toFixed(3));
        el.title = calor > 0 ? `${coordenada(f, c)}: ${(mapa[f][c] / total * 100).toFixed(1)}% del peso` : "";
    });

    ui.leyendaRadar.hidden = !mapa;
}

function renderTableroEnemigo(revelar = false) {
    const puedeDisparar = fase === "batalla" && turnoJugador;
    const segura = aguaSegura(tableroEnemigo);
    ui.tableroEnemigo.classList.toggle("interactivo", puedeDisparar);

    recorrerCeldas((f, c) => {
        const el = celda("enemigo", f, c);
        const estado = tableroEnemigo.estadoCelda(f, c);
        const esSegura = !estado && segura.has(`${f},${c}`);

        el.classList.toggle("agua-segura", esSegura);
        el.classList.toggle("agua", estado === "agua");
        el.classList.toggle("tocado", estado === "tocado");
        el.classList.toggle("hundido", estado === "hundido");
        el.classList.toggle("revelado", revelar && !estado && !!tableroEnemigo.barcoEn(f, c));
        el.disabled = !puedeDisparar || estado !== null || esSegura;
    });
}

// ---------- Fase de ubicación ----------

function iniciarUbicacion() {
    partida++;
    clearInterval(intervaloCronometro);
    fase = "ubicacion";

    tableroJugador = new Tablero(10, 10);
    flotaJugador = FLOTA.map(b => new Barco(b.tipo, b.longitud));
    barcoSeleccionado = flotaJugador[0];
    direccionUbicacion = "horizontal";

    crearTablero(ui.tableroJugador, "jugador");
    crearMuelle();
    renderTableroJugador();
    actualizarMuelle();

    ui.botonIniciar.hidden = true;
    ui.botonParar.hidden = true;
    ui.botonReiniciar.hidden = true;
    ui.selectorDificultad.hidden = false;
    ui.panelUbicacion.hidden = false;
    ui.tableros.hidden = false;
    ui.panelEnemigo.hidden = true;
    ui.gameStats.hidden = true;
    ui.toggleRadarLabel.hidden = true;
    ui.mensajeFinal.style.display = "none";

    setEstado("Ubicá tu flota: elegí un barco y hacé clic (o arrastralo) al tablero. R o clic derecho para rotar. Los barcos no se pueden tocar.");
}

function crearMuelle() {
    ui.muelle.innerHTML = "";
    flotaJugador.forEach(barco => {
        const boton = document.createElement("button");
        boton.className = "barco-muelle";
        boton.draggable = true;
        boton.innerHTML = `<span class="nombre">${barco.tipo}</span><span class="casillas">${"<i></i>".repeat(barco.longitud)}</span>`;
        boton.addEventListener("click", () => seleccionarBarco(barco));
        boton.addEventListener("dragstart", (e) => {
            seleccionarBarco(barco);
            e.dataTransfer.setData("text/plain", barco.tipo);
            e.dataTransfer.effectAllowed = "move";
        });
        barco.elementoMuelle = boton;
        ui.muelle.appendChild(boton);
    });
}

function actualizarMuelle() {
    flotaJugador.forEach(barco => {
        barco.elementoMuelle.classList.toggle("seleccionado", barco === barcoSeleccionado);
        barco.elementoMuelle.classList.toggle("ubicado", barco.ubicado);
    });
    ui.botonBatalla.disabled = !flotaJugador.every(barco => barco.ubicado);
}

function seleccionarBarco(barco) {
    barcoSeleccionado = barco;
    actualizarMuelle();
}

function rotar() {
    direccionUbicacion = direccionUbicacion === "horizontal" ? "vertical" : "horizontal";
    if (celdaBajoCursor) mostrarPrevia(celdaBajoCursor);
}

function mostrarPrevia(el) {
    limpiarPrevia();
    celdaBajoCursor = el;
    if (!barcoSeleccionado) return;

    const fila = Number(el.dataset.fila);
    const columna = Number(el.dataset.columna);
    const valida = tableroJugador.puedeUbicar(barcoSeleccionado.longitud, fila, columna, direccionUbicacion, barcoSeleccionado);

    Tablero.celdasDe(barcoSeleccionado.longitud, fila, columna, direccionUbicacion)
        .filter(([f, c]) => tableroJugador.dentro(f, c))
        .forEach(([f, c]) => celda("jugador", f, c).classList.add(valida ? "previa" : "previa-invalida"));
}

function limpiarPrevia() {
    ui.tableroJugador.querySelectorAll(".previa, .previa-invalida")
        .forEach(el => el.classList.remove("previa", "previa-invalida"));
}

function ubicarEn(el) {
    const fila = Number(el.dataset.fila);
    const columna = Number(el.dataset.columna);

    if (!barcoSeleccionado) {
        // clic sobre un barco ya ubicado: se levanta para moverlo
        const barco = tableroJugador.barcoEn(fila, columna);
        if (!barco) return;
        direccionUbicacion = barco.direccion;
        tableroJugador.quitar(barco);
        seleccionarBarco(barco);
    } else if (tableroJugador.ubicar(barcoSeleccionado, fila, columna, direccionUbicacion)) {
        soundManager.playPlace();
        seleccionarBarco(flotaJugador.find(barco => !barco.ubicado) || null);
    } else {
        el.classList.add("sacudir");
        setTimeout(() => el.classList.remove("sacudir"), 400);
        return;
    }

    renderTableroJugador();
    mostrarPrevia(el);
}

function ubicarAleatorio() {
    tableroJugador.ubicarFlotaAleatoria(flotaJugador);
    seleccionarBarco(null);
    limpiarPrevia();
    renderTableroJugador();
    soundManager.playPlace();
}

function setupTableroJugador() {
    const tablero = ui.tableroJugador;
    const celdaDe = (e) => e.target.closest(".celda");

    tablero.addEventListener("click", (e) => {
        const el = celdaDe(e);
        if (el && fase === "ubicacion") ubicarEn(el);
    });
    tablero.addEventListener("mouseover", (e) => {
        const el = celdaDe(e);
        if (el && fase === "ubicacion") mostrarPrevia(el);
    });
    tablero.addEventListener("mouseleave", () => {
        celdaBajoCursor = null;
        limpiarPrevia();
    });
    tablero.addEventListener("contextmenu", (e) => {
        if (fase !== "ubicacion") return;
        e.preventDefault();
        rotar();
    });
    tablero.addEventListener("dragover", (e) => {
        const el = celdaDe(e);
        if (!el || fase !== "ubicacion") return;
        e.preventDefault();
        if (el !== celdaBajoCursor) mostrarPrevia(el);
    });
    tablero.addEventListener("drop", (e) => {
        const el = celdaDe(e);
        if (!el || fase !== "ubicacion") return;
        e.preventDefault();
        ubicarEn(el);
    });
}

// ---------- Batalla ----------

function iniciarBatalla() {
    fase = "batalla";
    limpiarPrevia();

    tableroEnemigo = new Tablero(10, 10);
    tableroEnemigo.ubicarFlotaAleatoria(FLOTA.map(b => new Barco(b.tipo, b.longitud)));
    ia = new IA(ui.dificultad.value);

    disparosRealizados = 0;
    impactosRealizados = 0;
    turnoJugador = true;
    inicioBatalla = Date.now();
    finBatalla = null;

    crearTablero(ui.tableroEnemigo, "enemigo");
    renderTableroJugador();
    renderTableroEnemigo();

    ui.panelUbicacion.hidden = true;
    ui.selectorDificultad.hidden = true;
    ui.panelEnemigo.hidden = false;
    ui.gameStats.hidden = false;
    ui.toggleRadarLabel.hidden = false;
    ui.botonParar.hidden = false;

    clearInterval(intervaloCronometro);
    intervaloCronometro = setInterval(updateStats, 1000);
    updateStats();

    setEstado(`🎯 Tu turno: disparale a la flota enemiga (IA en modo ${DIFICULTADES[ia.dificultad]})`);
    soundManager.playGameStart();
}

function dispararJugador(el) {
    if (fase !== "batalla" || !turnoJugador) return;

    const fila = Number(el.dataset.fila);
    const columna = Number(el.dataset.columna);
    const { resultado, barco } = tableroEnemigo.atacar(fila, columna);
    if (resultado === "Repetido") return;

    disparosRealizados++;
    if (resultado !== "Agua") impactosRealizados++;
    turnoJugador = false;

    createShootEffect(el);
    renderTableroEnemigo();
    efectosResultado(el, resultado, barco, "enemigo");
    updateStats();

    if (tableroEnemigo.todosHundidos()) {
        finalizarJuego("victoria");
        return;
    }

    const mensajes = {
        Agua: "💧 Agua.",
        Tocado: "💥 ¡Tocado!",
        Hundido: `🔥 ¡Hundiste el ${barco?.tipo}!`
    };
    setEstado(`${mensajes[resultado]} La IA está apuntando…`);
    programar(turnoIA, 900);
}

function turnoIA() {
    if (fase !== "batalla") return;

    const [fila, columna] = ia.elegirDisparo();
    const { resultado, barco } = tableroJugador.atacar(fila, columna);
    ia.registrar(fila, columna, resultado, barco);

    const el = celda("jugador", fila, columna);
    ui.tableroJugador.querySelector(".ultimo-disparo-ia")?.classList.remove("ultimo-disparo-ia");
    el.classList.add("ultimo-disparo-ia");

    createShootEffect(el);
    renderTableroJugador();
    efectosResultado(el, resultado, barco, "jugador");
    updateStats();

    if (tableroJugador.todosHundidos()) {
        finalizarJuego("derrota");
        return;
    }

    const coord = coordenada(fila, columna);
    const mensajes = {
        Agua: `La IA disparó a ${coord}: agua.`,
        Tocado: `💥 ¡La IA te tocó un barco en ${coord}!`,
        Hundido: `🔥 ¡La IA hundió tu ${barco?.tipo}!`
    };
    turnoJugador = true;
    renderTableroEnemigo();
    setEstado(`${mensajes[resultado]} 🎯 Tu turno.`);
}

function efectosResultado(el, resultado, barco, prefijo) {
    if (resultado === "Tocado") {
        soundManager.playHit();
        createImpactParticles(el, '#ff4757');
    } else if (resultado === "Hundido") {
        soundManager.playSink();
        // todo el barco explota, no solo la última casilla
        barco.celdas.forEach(([f, c], i) => {
            const parte = celda(prefijo, f, c);
            setTimeout(() => {
                parte.classList.add("explosion");
                createExplosionEffect(parte);
                setTimeout(() => parte.classList.remove("explosion"), 800);
            }, i * 80);
        });
        createImpactParticles(el, '#ff6b35');
    } else {
        soundManager.playMiss();
        createSplashEffect(el);
    }
}

// ---------- Efectos visuales ----------

function centroDe(el) {
    const rect = el.getBoundingClientRect();
    return [rect.left + rect.width / 2, rect.top + rect.height / 2];
}

function efectosReducidos() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function createShootEffect(el) {
    if (efectosReducidos()) return;
    const [x, y] = centroDe(el);
    const shoot = document.createElement('div');
    shoot.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: radial-gradient(circle, #ffff00, #ff6b00);
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        left: ${x - 5}px;
        top: ${y - 5}px;
        animation: shoot-effect 0.5s ease-out forwards;
    `;

    document.body.appendChild(shoot);
    setTimeout(() => shoot.remove(), 500);
}

function createParticles(el, { cantidad, color, tamaño, distancia, caida, duracion }) {
    if (efectosReducidos()) return;
    const [centerX, centerY] = centroDe(el);

    for (let i = 0; i < cantidad; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: ${tamaño}px;
            height: ${tamaño}px;
            background: ${color};
            border-radius: 50%;
            pointer-events: none;
            z-index: 1001;
            left: ${centerX}px;
            top: ${centerY}px;
        `;

        const angle = (i * 360 / cantidad) * Math.PI / 180;
        const distance = distancia + Math.random() * distancia * 0.6;
        const endX = centerX + Math.cos(angle) * distance;
        const endY = centerY + Math.sin(angle) * distance + caida;

        particle.animate([
            { left: `${centerX}px`, top: `${centerY}px`, opacity: 1 },
            { left: `${endX}px`, top: `${endY}px`, opacity: 0 }
        ], {
            duration: duracion,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });

        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), duracion);
    }
}

function createImpactParticles(el, color) {
    createParticles(el, { cantidad: 8, color, tamaño: 4, distancia: 50, caida: 0, duracion: 600 });
}

function createSplashEffect(el) {
    createParticles(el, { cantidad: 6, color: '#03a9f4', tamaño: 6, distancia: 30, caida: 20, duracion: 400 });
}

function createExplosionEffect(el) {
    if (efectosReducidos()) return;
    const [centerX, centerY] = centroDe(el);

    const explosion = document.createElement('div');
    explosion.style.cssText = `
        position: fixed;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, rgba(255,69,0,0.8), rgba(255,140,0,0.4), transparent);
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        left: ${centerX - 50}px;
        top: ${centerY - 50}px;
        animation: explosion-burst 0.8s ease-out forwards;
    `;

    document.body.appendChild(explosion);
    setTimeout(() => explosion.remove(), 800);
}

// ---------- Estadísticas y fin de partida ----------

function formatearTiempo(segundos) {
    return `${Math.floor(segundos / 60)}:${(segundos % 60).toString().padStart(2, '0')}`;
}

function segundosJugados() {
    if (!inicioBatalla) return 0;
    return Math.floor(((finBatalla ?? Date.now()) - inicioBatalla) / 1000);
}

function precision() {
    return disparosRealizados > 0 ? Math.round((impactosRealizados / disparosRealizados) * 100) : 0;
}

function updateStats() {
    ui.tiempoCount.textContent = formatearTiempo(segundosJugados());
    ui.disparosCount.textContent = disparosRealizados;
    ui.precisionCount.textContent = `${precision()}%`;
    ui.barcosCount.textContent = `${tableroEnemigo.barcosRestantes}/${FLOTA.length}`;
    ui.flotaCount.textContent = `${tableroJugador.barcosRestantes}/${FLOTA.length}`;
}

function finalizarJuego(motivo) {
    fase = "fin";
    turnoJugador = false;
    finBatalla = Date.now();
    clearInterval(intervaloCronometro);
    updateStats();

    // se muestran los barcos enemigos que quedaron sin descubrir
    renderTableroEnemigo(true);
    renderTableroJugador();

    const titulos = {
        victoria: "🎉 ¡VICTORIA ÉPICA! 🎉\n¡Comandante, has destruido toda la flota enemiga!",
        derrota: "💀 ¡DERROTA! 💀\nLa IA hundió toda tu flota.",
        abortada: "🛑 ¡MISIÓN ABORTADA! 🛑\n¡El comando ha decidido retirarse!"
    };

    let mensaje = titulos[motivo];
    if (motivo !== "abortada") {
        mensaje += `\n\n📊 Estadísticas:\n🤖 IA: ${DIFICULTADES[ia.dificultad]}\n🎯 Precisión: ${precision()}%\n⏱️ Tiempo: ${formatearTiempo(segundosJugados())}\n💥 Disparos: ${disparosRealizados}`;
    }

    if (motivo === "victoria") soundManager.playGameWin();
    else soundManager.playGameLose();

    ui.botonParar.hidden = true;
    ui.botonReiniciar.hidden = false;
    setEstado(titulos[motivo].split("\n")[0]);

    ui.mensajeFinalTexto.textContent = mensaje;
    programar(() => {
        ui.mensajeFinal.style.display = "flex";
        ui.botonJugarDeNuevo.focus();
    }, motivo === "abortada" ? 0 : 1200);
}

function abortar() {
    if (fase !== "batalla") return;
    partida++; // descarta el turno pendiente de la IA
    finalizarJuego("abortada");
}

// Función de inicialización
function inicializarJuego() {
    const ids = {
        estado: "estado",
        mensajeFinal: "mensaje-final",
        mensajeFinalTexto: "mensaje-final-texto",
        botonIniciar: "boton-iniciar",
        botonReiniciar: "boton-reiniciar",
        botonParar: "boton-parar",
        botonJugarDeNuevo: "boton-jugar-de-nuevo",
        botonVerTableros: "boton-ver-tableros",
        selectorDificultad: "selector-dificultad",
        dificultad: "dificultad",
        panelUbicacion: "panel-ubicacion",
        muelle: "muelle",
        botonRotar: "boton-rotar",
        botonAleatorio: "boton-aleatorio",
        botonBatalla: "boton-batalla",
        gameStats: "game-stats",
        tiempoCount: "tiempo-count",
        disparosCount: "disparos-count",
        precisionCount: "precision-count",
        barcosCount: "barcos-count",
        flotaCount: "flota-count",
        tableros: "tableros",
        panelEnemigo: "panel-enemigo",
        tableroJugador: "tablero-jugador",
        tableroEnemigo: "tablero-enemigo",
        toggleRadar: "toggle-radar",
        toggleRadarLabel: "toggle-radar-label",
        leyendaRadar: "leyenda-radar"
    };
    Object.entries(ids).forEach(([clave, id]) => ui[clave] = document.getElementById(id));

    // Configurar eventos de botones
    ui.botonIniciar.addEventListener("click", iniciarUbicacion);
    ui.botonReiniciar.addEventListener("click", iniciarUbicacion);
    ui.botonJugarDeNuevo.addEventListener("click", iniciarUbicacion);
    ui.botonVerTableros.addEventListener("click", () => ui.mensajeFinal.style.display = "none");
    ui.botonParar.addEventListener("click", abortar);
    ui.botonRotar.addEventListener("click", rotar);
    ui.botonAleatorio.addEventListener("click", ubicarAleatorio);
    ui.botonBatalla.addEventListener("click", iniciarBatalla);

    ui.toggleRadar.addEventListener("change", () => {
        mostrarRadar = ui.toggleRadar.checked;
        renderTableroJugador();
    });

    ui.tableroEnemigo.addEventListener("click", (e) => {
        const el = e.target.closest(".celda");
        if (el && !el.disabled) dispararJugador(el);
    });
    setupTableroJugador();

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && ui.mensajeFinal.style.display === "flex") {
            ui.mensajeFinal.style.display = "none";
        } else if ((e.key === "r" || e.key === "R") && fase === "ubicacion" && e.target.tagName !== "SELECT") {
            rotar();
        }
    });

    setEstado("Ubicá tu flota, elegí la dificultad y enfrentá a la IA.");
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarJuego);
} else {
    inicializarJuego();
}
