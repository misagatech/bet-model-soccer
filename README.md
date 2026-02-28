# 🎯 Value Betting System - Modelo Poisson

[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-success)](https://misagatech.github.io/bet-model-soccer/web/)

Sistema profesional para detectar **value bets** en fútbol usando **modelo Poisson** basado en **xG (Expected Goals)**.

## ✨ Características

- ✅ Cálculo de probabilidades con distribución Poisson
- ✅ Detección automática de value (>5%)
- ✅ Interfaz web moderna y responsive
- ✅ Registro de apuestas y estadísticas en tiempo real
- ✅ Cálculo de ROI, Winrate y Profit
- ✅ Kelly Criterion para stake recomendado

## 🚀 Demo en vivo

La aplicación web está disponible en GitHub Pages:

🔗 **https://misagatech.github.io/bet-model-soccer/web/**

## 💻 Instalación y uso local

```bash
# Clonar repositorio
git clone https://github.com/misagatech/bet-model-soccer.git
cd bet-model-soccer

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar programa
python main.py

🌐 Uso de la interfaz web
Ve a la demo en vivo

Ingresa los xG de local y visitante

Ingresa la cuota de mercado

Haz clic en "Analizar Apuesta"

Si hay value, registra el resultado (win/loss)

Las estadísticas se actualizan automáticamente

📊 Ejemplo de uso
Campo	Valor
xG Local	1.8
xG Visitante	1.2
Cuota Over 2.5	1.95
Stake	100
Resultado del análisis:

Probabilidad real: 58.3%

Cuota justa: 1.71

Value: +14.2% ✅

Kelly stake recomendado: 2.8%

📁 Estructura del proyecto
text
bet-model-soccer/
│
├── 📁 src/                    # Módulos Python
│   ├── model.py               # Modelo Poisson
│   ├── tracker.py             # Registro de apuestas
│   └── __init__.py            # Inicializador
│
├── 📁 web/                     # Interfaz web
│   ├── index.html             # Estructura HTML
│   ├── style.css              # Estilos CSS
│   └── script.js              # Lógica JavaScript
│
├── 📁 data/                    # Datos (creado al ejecutar)
│   └── bets.csv               # Historial de apuestas
│
├── main.py                     # Programa principal CLI
├── requirements.txt            # Dependencias Python
├── .gitignore                  # Archivos ignorados
├── LICENSE                     # Licencia MIT
└── README.md                   # Documentación
🧮 Cómo funciona el modelo Poisson
El modelo Poisson calcula la probabilidad de Over 2.5 goles:

Para cada posible marcador (0-0, 0-1, ..., 5-5)

Calcula la probabilidad usando distribución Poisson

Suma las probabilidades donde el total de goles > 2.5

Compara con la cuota de mercado para detectar value

📈 Estadísticas que calcula
Winrate: Porcentaje de aciertos

ROI: Retorno de inversión

Profit: Ganancia/pérdida total

Value promedio: Media del value encontrado

Cuota promedio: Media de cuotas jugadas

🔜 Próximas mejoras
Conexión a API de odds en tiempo real

Más mercados (BTTS, 1X2, Hándicap)

Gráficos de rendimiento con Chart.js

Exportar historial a Excel/PDF

Alertas de value en tiempo real

🤝 Cómo contribuir
Fork el proyecto

Crea tu rama (git checkout -b feature/NuevaFuncion)

Commit tus cambios (git commit -m 'Añadir nueva función')

Push a la rama (git push origin feature/NuevaFuncion)

Abre un Pull Request

📝 Licencia
Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

⚠️ Disclaimer
Este software es para fines educativos y de análisis. Las apuestas deportivas implican riesgo financiero. Usa bajo tu propia responsabilidad.

📞 Contacto
MisagaTech

🌐 Web: www.misagatech.com

📧 Email: misagatech@gmail.com

📱 WhatsApp: 3142802903

🐙 GitHub: @misagatech

Project Link: https://github.com/misagatech/bet-model-soccer

Desarrollado con ❤️ por MisagaTech usando Python y JavaScript
