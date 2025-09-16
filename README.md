# 🚢 Batalla Naval - Juego Épico de Estrategia Naval

¡Bienvenido a **Batalla Naval**, un emocionante juego de estrategia donde pondrás a prueba tu puntería y habilidades tácticas para hundir la flota enemiga!

---

## 🎯 Descripción del Proyecto

Batalla Naval es una versión digital y moderna del clásico juego de hundir barcos. Con un tablero de 10x10, deberás localizar y destruir hasta 5 barcos enemigos de diferentes tamaños antes de que se acabe el tiempo. El juego combina una interfaz intuitiva, efectos visuales y sonoros envolventes, y una experiencia dinámica para mantenerte al borde de tu asiento.

---

## 🚀 Características Principales

- Tablero de 10x10 con botones interactivos para seleccionar posiciones.
- Hasta 5 barcos con tamaños variados (1 a 5 casillas).
- Lógica de juego que detecta impactos, hundimientos y agua.
- Temporizador con límite de tiempo para aumentar la tensión.
- Estadísticas en tiempo real: disparos realizados, impactos y barcos restantes.
- Efectos de sonido y animaciones para cada acción (disparo, impacto, hundimiento, agua).
- Botones para iniciar, abortar y reiniciar la partida.
- Diseño responsivo y moderno con animaciones suaves.

---

## 🎮 Cómo Jugar

1. Presiona **"Iniciar Misión"** para comenzar el juego.
2. Haz clic en las casillas del tablero para disparar.
3. Cada disparo puede ser:
   - **Tocado**: Has impactado un barco.
   - **Hundido**: Has destruido completamente un barco.
   - **Agua**: No hay barco en esa posición.
4. El juego termina cuando hundes todos los barcos o se acaba el tiempo.
5. Puedes abortar la misión en cualquier momento con el botón **"Abortar"**.
6. Al finalizar, revisa tus estadísticas y ¡prueba mejorar tu puntería!

---

## 🛠️ Instalación y Ejecución

Para jugar localmente, sigue estos pasos:

1. Clona o descarga este repositorio.
2. Asegúrate de tener [Node.js](https://nodejs.org/) instalado.
3. En la terminal, navega a la carpeta del proyecto.
4. Ejecuta el siguiente comando para iniciar un servidor local:

```bash
npm run dev
```

5. Abre tu navegador y visita: [http://localhost:3000](http://localhost:3000)
6. ¡Disfruta la partida!

---

## 📂 Estructura del Proyecto

- `index.html` - Estructura principal y elementos del juego.
- `styles.css` - Estilos y animaciones para una experiencia visual atractiva.
- `class.js` - Clases para manejar barcos y tablero con la lógica del juego.
- `functions.js` - Funciones para la interacción, eventos, sonidos y control del juego.
- `package.json` - Configuración del proyecto y scripts para servidor local.
- `consignas.txt` - Reglas y especificaciones del juego.

---

## 🛠️ Tecnologías Utilizadas

- HTML5
- CSS3 (con animaciones y diseño responsivo)
- JavaScript (ES6+)
- Web Audio API para efectos sonoros
- [http-server](https://www.npmjs.com/package/http-server) para servir localmente

---

## 📜 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).

---

¡Prepárate para la batalla y demuestra que eres el mejor comandante naval! ⚓🚀
