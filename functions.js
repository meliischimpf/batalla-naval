// Variables globales
let tablero;
let barcos;
let barcosHundidos = 0;
let intervaloTemporizador;
let tiempoLimite = 120;
let tiempoRestante = tiempoLimite;
let disparosRealizados = 0;
let impactosRealizados = 0;

// Elementos del DOM (inicializados cuando el DOM esté listo)
let temporizador, mensajeFinal, mensajeFinalTexto, botonIniciar, botonReiniciar, botonParar, gameStats, disparosCount, impactosCount, barcosCount;

// Sistema de sonidos mejorado
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API no soportada');
        }
    }

    createBeep(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
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

function generarTabla() {
    // Reiniciar estadísticas
    disparosRealizados = 0;
    impactosRealizados = 0;
    barcosHundidos = 0;
    tiempoRestante = tiempoLimite;
    
    // Crear tablero y barcos
    tablero = new Tablero(10, 10);
    barcos = [
        new Barco("Lancha", 1),
        new Barco("Crucero", 2),
        new Barco("Submarino", 3),
        new Barco("Buque", 4),
        new Barco("Portaaviones", 5)
    ];

    updateStats();
    updateTimer();
    
    tablero.crearTablero();

    // Colocar barcos con animación
    barcos.forEach((barco, index) => {
        setTimeout(() => {
            tablero.asignarBarco(barco);
        }, index * 300);
    });

    // Configurar eventos de los botones
    setTimeout(() => {
        setupBoardEvents();
    }, 1500);

    // Configurar temporizador
    clearInterval(intervaloTemporizador);
    intervaloTemporizador = setInterval(actualizarTemporizador, 1000);

    // Actualizar UI
    botonIniciar.style.display = "none";
    botonParar.style.display = "inline-block";
    botonReiniciar.style.display = "none";
    mensajeFinal.style.display = "none";
    gameStats.style.display = "flex";

    // Mostrar temporizador y tablero
    temporizador.classList.add("active");
    document.getElementById("tablero").classList.add("active");

    // Sonido de inicio
    soundManager.playGameStart();

    // Efecto de entrada del tablero
    const tableroElement = document.getElementById("tablero");
    tableroElement.style.animation = "board-entrance 1s ease-out";
}

function setupBoardEvents() {
    document.querySelectorAll(".boton").forEach(boton => {
        boton.addEventListener("click", (e) => {
            atacarCasilla(boton, e);
        });
        boton.disabled = false;
        boton.classList.remove("tocado", "hundido", "agua");
        
        // Efecto hover mejorado
        boton.addEventListener("mouseenter", () => {
            if (!boton.disabled) {
                boton.style.transform = "translateY(-2px) scale(1.05)";
            }
        });
        
        boton.addEventListener("mouseleave", () => {
            if (!boton.disabled) {
                boton.style.transform = "";
            }
        });
    });
}

function atacarCasilla(boton, event) {
    if (boton.disabled) return;

    // Crear efecto de disparo
    createShootEffect(event);
    
    disparosRealizados++;
    let [fila, columna] = boton.id.split("-").slice(1).map(Number);
    let resultado = tablero.atacarPosicion(fila, columna);

    // Efecto visual inmediato
    boton.style.transform = "scale(0.8)";
    
    setTimeout(() => {
        handleAttackResult(boton, resultado);
        updateStats();
    }, 200);

    boton.disabled = true;
}

function createShootEffect(event) {
    const shoot = document.createElement('div');
    shoot.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: radial-gradient(circle, #ffff00, #ff6b00);
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        left: ${event.clientX - 5}px;
        top: ${event.clientY - 5}px;
        animation: shoot-effect 0.5s ease-out forwards;
    `;
    
    document.body.appendChild(shoot);
    
    setTimeout(() => {
        shoot.remove();
    }, 500);
}

function handleAttackResult(boton, resultado) {
    boton.textContent = "";
    
    if (resultado === "Tocado") {
        boton.classList.add("tocado");
        impactosRealizados++;
        soundManager.playHit();
        
        // Efecto de partículas de impacto
        createImpactParticles(boton, '#ff4757');
        
    } else if (resultado === "Hundido") {
        boton.classList.add("hundido", "explosion");
        impactosRealizados++;
        barcosHundidos++;
        soundManager.playSink();
        
        // Efecto de explosión más dramático
        createExplosionEffect(boton);
        createImpactParticles(boton, '#ff6b35');
        
        // Marcar todo el barco como hundido con retraso
        setTimeout(() => {
            markSunkShip(boton);
        }, 800);
        
        if (barcosHundidos === barcos.length) {
            setTimeout(() => {
                finalizarJuego("🎉 ¡VICTORIA ÉPICA! 🎉\n¡Comandante, has destruido toda la flota enemiga!");
            }, 1500);
        }
        
    } else {
        boton.classList.add("agua");
        soundManager.playMiss();
        
        // Efecto de salpicadura de agua
        createSplashEffect(boton);
    }
}

function createImpactParticles(button, color) {
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: 4px;
            height: 4px;
            background: ${color};
            border-radius: 50%;
            pointer-events: none;
            z-index: 1001;
            left: ${centerX}px;
            top: ${centerY}px;
        `;
        
        const angle = (i * 45) * Math.PI / 180;
        const distance = 50 + Math.random() * 30;
        const endX = centerX + Math.cos(angle) * distance;
        const endY = centerY + Math.sin(angle) * distance;
        
        particle.animate([
            { left: `${centerX}px`, top: `${centerY}px`, opacity: 1 },
            { left: `${endX}px`, top: `${endY}px`, opacity: 0 }
        ], {
            duration: 600,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
        
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 600);
    }
}

function createExplosionEffect(button) {
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
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

function createSplashEffect(button) {
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 6; i++) {
        const drop = document.createElement('div');
        drop.style.cssText = `
            position: fixed;
            width: 6px;
            height: 6px;
            background: #03a9f4;
            border-radius: 50%;
            pointer-events: none;
            z-index: 1001;
            left: ${centerX}px;
            top: ${centerY}px;
        `;
        
        const angle = (i * 60) * Math.PI / 180;
        const distance = 30 + Math.random() * 20;
        const endX = centerX + Math.cos(angle) * distance;
        const endY = centerY + Math.sin(angle) * distance + 20;
        
        drop.animate([
            { left: `${centerX}px`, top: `${centerY}px`, opacity: 1 },
            { left: `${endX}px`, top: `${endY}px`, opacity: 0 }
        ], {
            duration: 400,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
        
        document.body.appendChild(drop);
        setTimeout(() => drop.remove(), 400);
    }
}

function markSunkShip(hitButton) {
    // Esta función podría marcar visualmente todo el barco hundido
    // Por simplicidad, solo agregamos un efecto extra al botón impactado
    hitButton.style.border = "3px solid #ff6b35";
    hitButton.style.boxShadow = "0 0 20px rgba(255, 107, 53, 0.8)";
}

function updateStats() {
    disparosCount.textContent = disparosRealizados;
    impactosCount.textContent = impactosRealizados;
    barcosCount.textContent = `${5 - barcosHundidos}/5`;
}

function updateTimer() {
    const minutos = Math.floor(tiempoRestante / 60);
    const segundos = tiempoRestante % 60;
    temporizador.innerHTML = `⏱️ Tiempo: ${minutos}:${segundos.toString().padStart(2, '0')}`;
    
    if (tiempoRestante <= 30) {
        temporizador.classList.add("timer-warning");
    } else {
        temporizador.classList.remove("timer-warning");
    }
}

function actualizarTemporizador() {
    tiempoRestante--;
    updateTimer();

    if (tiempoRestante <= 0) {
        finalizarJuego("⏰ ¡TIEMPO AGOTADO! ⏰\n¡La flota enemiga ha escapado!");
    }
}

function finalizarJuego(mensaje) {
    clearInterval(intervaloTemporizador);
    
    // Calcular estadísticas finales
    const precision = disparosRealizados > 0 ? Math.round((impactosRealizados / disparosRealizados) * 100) : 0;
    const tiempoUsado = tiempoLimite - tiempoRestante;
    
    let mensajeCompleto = mensaje;
    if (barcosHundidos === barcos.length) {
        mensajeCompleto += `\n\n📊 Estadísticas:\n🎯 Precisión: ${precision}%\n⏱️ Tiempo: ${Math.floor(tiempoUsado/60)}:${(tiempoUsado%60).toString().padStart(2,'0')}\n💥 Disparos: ${disparosRealizados}`;
        soundManager.playGameWin();
    } else {
        soundManager.playGameLose();
    }
    
    mensajeFinalTexto.innerHTML = mensajeCompleto.replace(/\n/g, '<br>');
    mensajeFinal.style.display = "flex";
    
    botonParar.style.display = "none";
    botonReiniciar.style.display = "inline-block";

    // Deshabilitar todos los botones del tablero
    document.querySelectorAll(".boton").forEach(boton => {
        boton.disabled = true;
    });
}

function reiniciarJuego() {
    window.location.reload();
}


// Función de inicialización
function inicializarJuego() {
    // Inicializar elementos del DOM
    temporizador = document.getElementById("temporizador");
    mensajeFinal = document.getElementById("mensaje-final");
    mensajeFinalTexto = document.getElementById("mensaje-final-texto");
    botonIniciar = document.getElementById("boton-iniciar");
    botonReiniciar = document.getElementById("boton-reiniciar");
    botonParar = document.getElementById("boton-parar");
    gameStats = document.getElementById("game-stats");
    disparosCount = document.getElementById("disparos-count");
    impactosCount = document.getElementById("impactos-count");
    barcosCount = document.getElementById("barcos-count");

    // Configurar eventos de botones
    botonIniciar.addEventListener("click", generarTabla);
    botonParar.addEventListener("click", () => {
        finalizarJuego("🛑 ¡MISIÓN ABORTADA! 🛑\n¡El comando ha decidido retirarse!");
    });
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarJuego);
} else {
    inicializarJuego();
}

// Estilos de animación CSS agregados dinámicamente
const styleSheet = document.createElement("style");
styleSheet.textContent = `
@keyframes shoot-effect {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.5); opacity: 0.8; }
    100% { transform: scale(0); opacity: 0; }
}

@keyframes explosion-burst {
    0% { transform: scale(0); opacity: 1; }
    50% { transform: scale(1.5); opacity: 0.6; }
    100% { transform: scale(2); opacity: 0; }
}
`;
document.head.appendChild(styleSheet);
