# Evoluciona

Aplicación local que junta cuatro cosas que normalmente viven en cuatro apps distintas —
rutina diaria, entrenamiento, alimentación y finanzas personales— y las conecta a **un avatar
que evoluciona con tu progreso real**.

No necesita internet, no tiene servidor, no manda datos a ninguna parte y no depende de
claude.ai ni de ningún otro servicio. Todo se calcula y se guarda en tu propio dispositivo.

---

## Cómo abrirla

**En el PC:** doble clic en `ABRIR EVOLUCIONA.bat`. Se levanta un servidor local y se abre el
navegador en `http://localhost:4173`. Para cerrar, `Ctrl + C` en la ventana negra.

Requiere tener **Node.js** instalado (https://nodejs.org). Si no lo tienes, el archivo te avisa.

**En el celular (misma red WiFi):** con el servidor corriendo en el PC, averigua la IP con
`ipconfig` y entra desde el teléfono a `http://<ip-del-pc>:4173`. Desde el menú del navegador,
"Agregar a pantalla de inicio" y queda como una app más, con su icono.

> No se puede abrir el `index.html` con doble clic: los navegadores bloquean los módulos de
> JavaScript cuando se cargan desde `file://`. Por eso existe el `.bat`.

---

## Las cuatro áreas

### 🔥 Rutina
Hábitos organizados en mañana, tarde y noche, con hora y área (cuerpo, mente, nutrición, dinero,
orden). Vienen 10 hábitos de partida; puedes editarlos, pausarlos o crear los tuyos. Los hábitos
con meta numérica (pasos, páginas) se llevan con contador, no con visto bueno.

Se calcula tu **racha** (días seguidos sobre 80% de cumplimiento), tu récord histórico, un mapa de
calor de 28 días y el cumplimiento de cada hábito por separado, para que veas cuál es el eslabón
que siempre falla.

### 🏋️ Entrenamiento
El plan semanal se **genera** según tus días disponibles, tu equipo (casa / mancuernas / gimnasio)
y tu nivel desbloqueado. Con 2-3 días arma cuerpo completo; con 4, torso-pierna; con 5-6, empuje-
tirón-pierna. Es determinista: la misma semana siempre da la misma rutina, para que no cambie cada
vez que abres la app. El botón "Regenerar plan" la rehace con otra combinación.

**Los 5 niveles de contenido** se abren por nivel de avatar *y* sesiones acumuladas:

| Nivel | Nombre | Requisito | Prescripción |
|---|---|---|---|
| 1 | Iniciación | desde el inicio | 2-3 × 10-15 reps |
| 2 | Base | nivel 3 + 6 sesiones | 3 × 8-12 |
| 3 | Fuerza | nivel 7 + 20 sesiones | 3-4 × 5-8 |
| 4 | Hipertrofia avanzada | nivel 12 + 45 sesiones | 4-5 × 8-12 |
| 5 | Élite | nivel 18 + 80 sesiones | 4-6 × 3-8 |

Al registrar las series, la app aplica **doble progresión**: si completaste todas las series en el
tope del rango, te sube la carga (+5 kg sobre 40 kg, +2,5 kg bajo eso); si fallaste la mitad, te la
baja un 10%; en el medio, te dice que sumes repeticiones. Calcula el **1RM estimado** con la fórmula
de Epley, detecta récords personales y muestra el **volumen semanal por grupo muscular** contra el
rango recomendado de 10-20 series.

### 🥗 Nutrición
Los objetivos salen de tus datos con fórmulas estándar, no de números inventados:

- **Metabolismo basal**: Mifflin-St Jeor.
- **Gasto total**: basal × factor de actividad (1,2 a 1,9).
- **Meta calórica**: −20% para bajar grasa, +12% para ganar músculo, igual para mantener.
- **Recomposición** (perder grasa y ganar músculo a la vez): −10% de déficit y 2,4 g de proteína por
  kilo, que es lo que muestra la evidencia que funciona.
- **Proteína**: 1,6 a 2,2 g por kilo según objetivo. **Grasa**: 0,8 a 1 g por kilo.
  **Carbohidratos**: las calorías que sobran.
- **Agua**: 35 ml por kilo + 500 ml por entrenamiento planificado.
- **Fibra**: 14 g por cada 1.000 kcal. **Azúcares libres**: máximo 10% de las calorías
  (ideal bajo 5%, criterio OMS). **Sodio**: máximo 2.000 mg.

Hay **80 alimentos** de consumo habitual en Chile (marraqueta, completo, empanada de pino, jurel en
lata, palta, quinoa…) con sus macros, azúcar, sodio y fibra por 100 g y su porción típica.

**¿Perder grasa y ganar músculo a la vez?** La app responde con tus datos en vez de prometer lo mismo
a todos. La recomposición corporal está documentada, pero funciona donde hay margen: en quien empieza,
en quien retoma tras una pausa y en quien tiene grasa disponible. En alguien entrenado y ya delgado el
avance es tan lento que rinde más separar las etapas, y eso **la app se lo dice**, con el plan por
etapas como alternativa. El veredicto usa la experiencia declarada (o la deducida de las sesiones
registradas) y el porcentaje de grasa, medido o estimado del IMC con su margen declarado.

Como en recomposición la balanza casi no se mueve, la app pide también el **contorno de cintura** y lo
grafica aparte: es el indicador que muestra que la grasa baja mientras las cargas suben.

**Comida preparada.** Además de los ingredientes hay **34 platos** de los que se comen fuera de casa,
con la porción con que se sirven acá: sushi (california, panko, sashimi), parrilla (asado de tira,
entraña, choripán, costillar), pizza, completo italiano, churrasco, chorrillana, lomo a lo pobre,
cazuela, pastel de choclo, sopaipillas, tallarines, lasaña, poke, hamburguesas, y también pisco sour,
vino y schop. Cada uno trae su composición y un consejo concreto ("el pebre no suma casi nada; la
mayonesa sí, unas 90 kcal por cucharada").

**Escáner de códigos de barras.** Apuntas la cámara al envase y la app busca el producto. Funciona en
Chrome para Android; en el resto se puede escribir el código a mano. Esta es **la única parte de la
app que necesita internet**: un código de barras no dice nada por sí solo, hay que preguntarle a una
base de datos quién es. Se usa Open Food Facts, que es abierta y gratuita. Cada producto consultado
**queda guardado en tu dispositivo**, así que la segunda vez que escaneas el mismo yogur ya funciona
sin conexión. Si el producto no está en la base, se carga a mano una vez copiando la tabla del
envase y queda para siempre.

La sección "Qué te conviene comer ahora" no es genérica: mira qué macro te falta, cuántas calorías
te quedan disponibles y si ya vas apretado de azúcar o sodio, y ordena los alimentos por cuánto
cierran ese hueco sin romper los límites.

### 💰 Finanzas
Ingresos, gastos por 13 categorías y ahorro. Calcula balance, **tasa de ahorro**, comparación con la
**regla 50/30/20**, presupuesto por categoría con alerta cuando el gasto va más rápido que el mes,
**fondo de emergencia** en meses de gastos cubiertos, metas de ahorro con fecha estimada y
proyección de **interés compuesto** a 10 años.

Los consejos apuntan a montos concretos: "Vivienda se lleva 50,9% de tus gastos ($420.000); si
recortas un 15% liberas $63.000 al mes".

---

### 🩸 Diabetes (opcional)

Apagada por omisión: se activa desde el perfil. Sirve para diabetes tipo 1, tipo 2, gestacional o
prediabetes, con medición capilar registrada a mano.

- **Glicemias** con momento del día (ayunas, después de almuerzo, madrugada…) y clasificación
  automática según los umbrales clínicos.
- **Tiempo en rango**, que es el indicador que hoy se mira en consulta, más que el promedio. Con las
  metas del consenso internacional: sobre 70% en rango, bajo 4% en hipoglicemia, variabilidad ≤36%.
- **HbA1c estimada (GMI)** a partir del promedio, declarada siempre como estimación.
- **Patrones por hora del día**: es lo que encuentra el problema real, del tipo "siempre se va abajo
  de madrugada". Ese hallazgo es el que cambia un tratamiento.
- **Registro de insulina** puesta, con el esquema del médico a la vista.
- **Informe para el control**, imprimible o guardable en PDF.
- **Ante una hipoglicemia** muestra la regla 15/15 y, si es grave, que es una urgencia.

**Lo que esta sección NO hace, a propósito:** no calcula ni sugiere dosis de insulina. Las razones de
cada persona las fija su médico y cambian con el tiempo; un error de cálculo ahí puede causar una
hipoglicemia grave, y un software que decide dosis es un dispositivo médico regulado. La app muestra
los carbohidratos del plato y recuerda el esquema indicado: la decisión queda en quien corresponde.

Una decisión de diseño que vale la pena explicar: **se dan puntos por medir y registrar, nunca por el
valor obtenido.** Premiar una "buena" glicemia castigaría a alguien por un número que no controla del
todo, y empujaría a no registrar los días malos, que son justamente los que el médico necesita ver.

## El avatar

No es una decoración: cada parte sale de un dato real.

| Rasgo visible | De dónde sale |
|---|---|
| Ancho de hombros y grosor de brazos | tonelaje acumulado y récords, relativos a tu peso |
| Definición del abdomen | proporción de días dentro de tu meta calórica |
| Halo bajo los pies | racha de hábitos |
| Líneas de movimiento | minutos de acondicionamiento |
| Emblema en el pecho | puntaje de salud financiera sobre 60 |
| Corona | etapa 9 o superior |

Hay **10 etapas evolutivas**, una cada 3 niveles aproximadamente: Despertar, Constante, Activo,
Firme, Atlético, Forjado, Titán, Maestro, Leyenda y Ascendido.

El **radar de atributos** del panel muestra los cinco pilares —fuerza, resistencia, nutrición,
disciplina y finanzas— de 0 a 100. Si uno está hundido, se nota de inmediato.

---

## Tokens, niveles y logros

Cada acción real entrega **XP** (sube el nivel) y **tokens ◈ EVO** (se gastan en la tienda).

| Acción | XP | ◈ |
|---|---|---|
| Hábito cumplido | 10 | 1 |
| Día perfecto de rutina | 60 | 5 |
| Racha de 7 / 30 días | 120 / 500 | 12 / 60 |
| Entrenamiento completado | 45 + 3 por serie | 8 |
| Récord personal | 80 | 15 |
| Semana de entrenamiento completa | 150 | 15 |
| Día en meta calórica | 30 | 5 |
| Proteína cubierta / hidratación completa | 20 / 15 | 3 / 2 |
| Movimiento de dinero registrado | 4 | 0 |
| Día con finanzas al día | 15 | 2 |
| Mes dentro del presupuesto | 300 | 40 |
| Meta de ahorro cumplida | 400 | 50 |
| Subir de nivel | — | 10 |

Además hay **25 logros** que entregan entre 3 y 250 ◈.

### Qué desbloquean de verdad los artículos de la tienda

Todo lo que se vende existe y funciona:

| Artículo | Qué hace |
|---|---|
| Cronómetro de descanso | Temporizador entre series, con +30 s y vibración al terminar |
| Series de aproximación | Calcula el calentamiento exacto (40-60-80-90%) para tu carga del día |
| Planificador de descarga | Detecta 4 semanas subiendo carga o 3 estancado y propone la semana de descarga |
| Analítica avanzada | Tendencia del 1RM por ejercicio, peso corporal y relación calorías/rendimiento |
| Panel de micronutrientes | Hierro, calcio, potasio y vitamina C, con cobertura de datos declarada |
| Recordatorios | Avisos del navegador a la hora de cada hábito |
| Planes de comida y recetario | 7 días de menú calculados para tus calorías, con lista de compras |
| Niveles anticipados | Abre los bloques de entrenamiento antes de alcanzar el nivel |
| Atuendos, auras, mascotas y temas | Cambian el avatar y la paleta de la app |

Un detalle importante del diseño: el reparto es **idempotente**. La app no premia en el momento del
clic, sino que recorre tus datos y paga cada condición cumplida una sola vez, con una clave por
evento. Si editas o borras un registro antiguo, los premios ya entregados no se duplican ni se
pierden. No se puede hacer trampa marcando y desmarcando un hábito.

---

## El modelo de negocio

La tienda tiene **dos vías hacia el mismo contenido**:

**Vía gratuita.** Todo el catálogo —28 artículos: niveles de entrenamiento anticipados, planes de
comida, recetario, atuendos, auras, mascotas, temas y herramientas— se consigue con tokens ganados
cumpliendo metas reales. Nada queda fuera del alcance de quien no paga.

**Vía pagada.** Seis paquetes que entregan tokens y contenido de golpe, con precios de referencia
entre $2.990 y $24.990 (pago único, sin suscripción). Lo que se compra es **tiempo, no ventaja**.

Por qué este modelo se sostiene:

- El usuario que no paga igual usa la app a diario, genera racha y la recomienda. Es el motor de
  crecimiento, no un costo.
- La conversión ocurre *después* de que el hábito está instalado, cuando la persona ya comprobó que
  la app le sirve. Es el momento con mejor tasa de conversión y menos devoluciones.
- Un pago único reduce la fricción de entrada y elimina las bajas por suscripción. El ingreso
  recurrente vendría del contenido nuevo, no de cobrar por seguir usando lo que ya se compró.

Otras líneas de ingreso posibles, en orden de esfuerzo:

1. Bolsas de tokens y paquetes de contenido (lo que ya está maquetado).
2. Planes de nutrición y rutinas firmados por nutricionistas y entrenadores, como contenido premium
   con marca propia.
3. Versión para gimnasios y entrenadores personales: un panel para seguir a varios alumnos, cobrado
   por alumno activo. Es el segmento que más paga y el que menos se va.
4. Convenios con marcas de suplementos o con supermercados dentro de la lista de compras, siempre
   declarados como publicidad.

**Lo que falta para cobrar de verdad:** una cuenta de comercio (Mercado Pago, Flow, Transbank o
Stripe), un servidor mínimo que valide los pagos y registre qué compró cada persona, y cuentas de
usuario. Hoy los pagos están en **modo demostración**: el botón activa el paquete localmente, no se
cobra nada y ningún dato sale del dispositivo. Eso está señalizado dentro de la app.

---

## Sobre los datos

Todo se guarda en el almacenamiento local del navegador (`localStorage`), en este dispositivo. No
hay cuenta, no hay nube, no hay telemetría.

Consecuencia importante: **si borras los datos del navegador, pierdes el progreso.** Desde
`Perfil → Descargar respaldo` obtienes un archivo `.json` con todo, que puedes restaurar en otro
equipo o después de formatear.

---

## Para desarrollar

```
npm test        # 308 pruebas del núcleo de cálculo
npm run servir  # levanta el servidor en el puerto 4173
```

Estructura:

```
js/nucleo/      cálculo puro, sin DOM: se prueba en Node
  utiles.js         fechas locales, formatos, generador con semilla
  nutricion.js      Mifflin-St Jeor, macros, evaluación del día, sugerencias
  entrenamiento.js  niveles, generador de rutinas, 1RM, doble progresión, volumen
  finanzas.js       resumen mensual, presupuesto, fondo de emergencia, proyecciones
  habitos.js        estado del día, rachas, cumplimiento, disciplina
  progreso.js       XP, niveles, tokens, logros, atributos del avatar
  avatar.js         SVG generado a partir de los atributos
  tienda.js         canje con tokens y aplicación de paquetes
  menus.js          menús de 7 días y lista de compras
  analitica.js      regresiones, tendencias de fuerza y peso, correlaciones
  micronutrientes.js hierro, calcio, potasio y vitamina C, con cobertura de datos
  productos.js      códigos de barras: validación, Open Food Facts y carga manual
  recordatorios.js  a quién avisar y cuándo (sin tocar el navegador)
  almacen.js        estado, persistencia y reparto idempotente de recompensas
js/datos/       catálogos: 80 alimentos, 34 platos preparados, 76 ejercicios,
                micronutrientes, 28 artículos de tienda y 6 paquetes
js/ui/          vistas; cada una expone html(ctx) y un objeto de acciones
pruebas/        node:test, sin dependencias externas
```

Las vistas no manejan eventos directamente: `app.js` escucha en el documento y despacha según el
atributo `data-accion` al módulo de la vista activa. Por eso agregar un botón es agregar un atributo
y una función, sin registrar nada.

La paleta de los gráficos está validada para daltonismo y contraste sobre la superficie oscura de la
app; el estado nunca se comunica solo con color, siempre lleva icono y etiqueta.

### Si modificas archivos y no ves los cambios

La app registra un *service worker* para funcionar sin conexión. Usa la estrategia
"responde con lo guardado y actualiza en segundo plano", así que los cambios aparecen **al segundo
refresco**. Si necesitas verlos de inmediato, abre las herramientas del navegador (F12) →
Aplicación → Service Workers → "Unregister", y recarga.
