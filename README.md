# 🚢 Batalla Naval - Vos contra la IA

¡Bienvenido a **Batalla Naval**! Ubicá tu flota, elegí la dificultad y enfrentate a una IA que calcula, disparo a disparo, dónde es más probable que estén escondidos tus barcos. Y podés ver lo que está pensando en tiempo real. 📡

Hecho con HTML, CSS y JavaScript puro, sin frameworks ni dependencias.

---

## 🚀 Características Principales

- **Rival con IA en 3 dificultades** (ver [cómo funciona](#-cómo-funciona-la-ia)).
- **📡 Radar de la IA**: un mapa de calor sobre tu tablero muestra la probabilidad que la IA le asigna a cada casilla y cuál es su próximo objetivo.
- **Ubicación de la flota** con clic o drag & drop, rotación con `R` o clic derecho, vista previa válida/inválida y ubicación aleatoria.
- Flota clásica: Portaaviones (5), Buque (4), Submarino (3), Crucero (3) y Lancha (2). Los barcos no pueden tocarse, ni siquiera en diagonal.
- Al hundir un barco explota entero y las casillas de alrededor se marcan como agua segura. Al terminar se revelan los barcos enemigos que no encontraste.
- Estadísticas en vivo: tiempo, disparos, precisión y barcos restantes de cada lado.
- Sonidos sintetizados con Web Audio API y animaciones para cada disparo.
- Responsive, navegable con teclado, con anuncios para lectores de pantalla y respeto por `prefers-reduced-motion`.

---

## 🎮 Cómo Jugar

1. Presioná **"Iniciar Misión"**.
2. Ubicá tus 5 barcos: elegí uno y hacé clic (o arrastralo) al tablero. `R` o clic derecho para rotar. Clic sobre un barco ubicado para moverlo. O usá **🎲 Aleatorio**.
3. Elegí la dificultad y presioná **"¡A la batalla!"**.
4. Disparale a la flota enemiga: cada disparo puede ser **Agua**, **Tocado** o **Hundido**. Después dispara la IA.
5. Gana quien hunda primero toda la flota rival.
6. Activá **📡 Radar de la IA** para ver dónde cree la IA que están tus barcos.

---

## 🤖 Cómo funciona la IA

La IA no hace trampa: no ve tu tablero, solo conoce el resultado de sus propios disparos. Medio y Difícil además deducen agua: como los barcos son rectos y no se tocan, las diagonales de un impacto y todo lo que rodea a un barco hundido no pueden tener barcos.

| Dificultad | Estrategia |
|---|---|
| **Fácil** | Dispara al azar a cualquier casilla donde todavía no disparó. |
| **Medio** | *Caza y remata*: busca en patrón de tablero de ajedrez (el barco más chico ocupa al menos 2 casillas, así que no hace falta mirar todas) y, cuando toca un barco, prueba las casillas vecinas siguiendo la línea de los impactos. |
| **Difícil** | *Densidad de probabilidad*: para cada barco que todavía no hundió, recorre todas las posiciones en las que podría estar sin contradecir lo que ya sabe, y suma cuántas pasan por cada casilla. Si hay impactos sin resolver, solo cuentan las posiciones que los atraviesan (con mucho más peso cuantos más atraviesen). Dispara a la casilla con mayor puntaje. Ese mapa es el que muestra el radar. |

Disparos que necesita cada dificultad para hundir una flota ubicada al azar (1000 partidas simuladas):

| Dificultad | Promedio | Mejor | Peor |
|---|---|---|---|
| Fácil | 95,2 | 64 | 100 |
| Medio | 43,9 | 22 | 68 |
| Difícil | 38,6 | 21 | 59 |

---

## 🛠️ Instalación y Ejecución

No necesita build. Para jugar localmente:

```bash
npm run dev
```

Y abrí [http://localhost:3000](http://localhost:3000). También funciona abriendo `index.html` directamente en el navegador.

---

## 📂 Estructura del Proyecto

- `index.html` - Estructura principal y elementos del juego.
- `styles.css` - Estilos, animaciones y diseño responsivo.
- `class.js` - Lógica pura del juego: clases `Barco` y `Tablero` (ubicación, disparos, estado).
- `ia.js` - El rival: las tres estrategias y el mapa de probabilidad.
- `functions.js` - Interfaz: fases de ubicación y batalla, turnos, radar, sonidos y efectos.

---

## 🛠️ Tecnologías Utilizadas

- HTML5
- CSS3 (grid, animaciones y diseño responsivo)
- JavaScript (ES6+), sin dependencias
- Web Audio API para efectos sonoros

---

## 📜 Licencia

Este proyecto está bajo la licencia MIT.

---

¡Prepárate para la batalla y demuestra que eres el mejor comandante naval! ⚓🚀
