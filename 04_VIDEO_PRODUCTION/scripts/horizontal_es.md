# Pricing Demo — por Alfonso Cifuentes (horizontal_es)

Versión del guion 3.0 · duración real 225.6 s · voz ElevenLabs (es)

## origin · Origen · 0.0–35.8 s

**Locución:** Este proyecto nació de una prueba técnica que hice durante un proceso de selección para un puesto de análisis de datos en una empresa internacional de libros educativos. Tenía que estudiar un catálogo de productos, entender cómo estaban organizados sus precios y explicar qué conclusiones se podían sacar. Para convertir aquel trabajo en un caso de estudio público, reconstruí el ejercicio con nombres, colecciones y precios completamente ficticios.

**Pantalla:** Título PRICING DEMO / por Alfonso Cifuentes. Ficha: prueba técnica real → caso independiente con datos ficticios. Sin marcas reales.

## problem · El problema · 35.8–63.1 s

**Locución:** Parece sencillo: tienes una lista de libros y sus precios. Pero un mismo curso puede tener libro del alumno, cuaderno, versiones con soluciones, diferentes niveles, ediciones o acceso digital. Si comparas dos precios sin tener todo eso en cuenta, puedes ver una anomalía donde no la hay. Así que la primera pregunta no era qué producto era más caro, sino cuáles se podían comparar de verdad.

**Pantalla:** Un curso se ramifica en variantes. Comparación incorrecta tachada; comparación válida marcada.

## method · El trabajo · 63.1–98.0 s

**Locución:** Para la versión pública construí un catálogo ficticio de 362 registros, repartidos en 12 colecciones. Partí de cinco campos y lo enriquecí hasta diecinueve, separando tipo de producto, nivel, edición, complementos y derechos digitales. Conservé siempre el archivo de origen y dejé las correcciones en una vista de análisis separada. Después agrupé los productos con la misma configuración, de modo que solo cambiara el nivel.

**Pantalla:** 5 → 19 atributos; capas origen / vista de análisis; clave de agrupación con el nivel como única variable.

## exceptions · Seis excepciones · 98.0–125.6 s

**Locución:** Al agrupar los productos comparables aparecieron 60 conjuntos con varios niveles. En 54, el precio no cambiaba. En 6, sí. Cuatro casos correspondían a niveles Starter con un precio inferior. Puede ser una política comercial de entrada, pero los datos por sí solos no demuestran la intención. Quedaban otros dos casos que merecían una investigación distinta.

**Pantalla:** 60 celdas: 54 uniformes, 6 marcadas. Cuatro «Starter: posible política», dos «Investigar». Sin revelar la solución.

## finding · El hallazgo · 125.6–162.8 s

**Locución:** La pista estaba en los propios grupos: en cada uno, el mismo nivel aparecía dos veces. El título del libro apuntaba a una colección, y el campo de serie indicaba otra. Agrupado con ese campo, parecía una diferencia de precio. Contrastado con la identidad del producto, era un problema de clasificación. Reubiqué esos dos registros solo en la vista de análisis, sin tocar los datos originales. Con los mismos 60 grupos comparables, los que tenían un precio uniforme pasaron de 54 a 56.

**Pantalla:** Grupo Glasshouse con B1 duplicado; el registro «Mosaic English B1» se mueve a su serie; segundo caso Kindred Horizons → Glasshouse. 54/60 → 56/60, denominador fijo.

## limits · Límites · 162.8–198.3 s

**Locución:** Aparecieron otras trampas: dos formas de escribir la misma edición, un título que contiene la palabra «ebook» sin ser un libro digital, un precio atípico con una abreviatura sin definir y libros en dos partes que, juntas, cuestan más que el volumen completo. El análisis las detecta y las convierte en preguntas claras para un equipo comercial. Pero no pretende fijar el precio correcto: aquí no hay datos de ventas, costes, márgenes ni demanda. Y todo este catálogo, de principio a fin, es inventado.

**Pantalla:** Fichas de investigación: edición, Gleebook, TB, partes A + B. Después: lo que los datos no permiten saber.

## close · Conclusión · 198.3–225.6 s

**Locución:** Para mí, lo interesante de este caso es que el dato más llamativo no siempre es el problema real. A veces, antes de decidir sobre un precio, hay que revisar cómo hemos definido el producto. En la web puedes explorar los datos, comprobar las fórmulas y descargar las presentaciones. Soy Alfonso Cifuentes, y esto es Pricing Demo.

**Pantalla:** «Primero, la comparabilidad. Después, el precio.» Firma, URL, nota de datos ficticios y voz sintética.
