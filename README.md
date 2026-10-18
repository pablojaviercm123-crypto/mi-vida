# Mi Proyecto de Vida

App para el celular (PWA) con todo tu proyecto de vida en un solo lugar:

- **Hoy**: resumen del día con tu skincare, tu entreno, tus metas y tu dinero del mes.
- **Metas y proyectos**: metas por área (personal, salud, finanzas, estudios, relaciones, proyectos), divididas en pasos con barra de avance y fecha límite.
- **Finanzas**: ingresos y gastos por categoría, tasa de ahorro, metas de ahorro, calculadoras de interés compuesto y de préstamos, y ayuda para decidir (“¿Me lo compro?” y una tabla para comparar opciones).
- **Entreno en casa**: plan de 12 semanas sin equipo pensado para vóley, basado en guías de la OMS y el ACSM y en revisiones científicas: A (potencia y piernas), B (tren superior y hombros), C (core, agilidad y resistencia) y una sesión opcional de yoga. Incluye una guía científica con fuentes ([docs/guia-entrenamiento.md](docs/guia-entrenamiento.md)).
- **Skincare**: rutina de mañana, noche y semanal con check diario, racha y calendario de 4 semanas.
- **Recordatorios**: descarga un archivo de calendario (.ics) para que tu celular te avise del skincare y del entreno.

Los datos se guardan solo en tu celular (sin cuentas ni servidores). Desde **Ajustes** puedes descargar una copia de seguridad y restaurarla.

## Publicarla con GitHub Pages

1. En GitHub, abre el repositorio → **Settings** → **Pages**.
2. En *Build and deployment* elige **Deploy from a branch**, la rama con la app y la carpeta **/ (root)**, y guarda.
3. En un minuto la app estará en `https://<tu-usuario>.github.io/pablopersonal/`.

## Instalarla en el celular

- **Android (Chrome)**: abre el enlace → menú ⋮ → *Instalar aplicación*.
- **iPhone (Safari)**: abre el enlace → Compartir → *Agregar a inicio*.

## Desarrollo

No necesita compilación: son archivos estáticos (`index.html`, `styles.css`, `data.js`, `app.js`, `sw.js`).

```sh
python3 -m http.server 8000
# abrir http://localhost:8000
```

Al cambiar archivos, sube la versión de `CACHE` en `sw.js` para que los celulares descarguen la versión nueva.
