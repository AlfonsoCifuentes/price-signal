# Diccionario de datos y reproducción (resumen en español)

La versión de referencia es `DATA_DICTIONARY.md` (inglés, va al repositorio público). Resumen:

- `generate_independent_dataset.py` inventa 362 productos en 12 series con una semilla fija (20261011). No lee ningún fichero de entrada. No hay ventas, costes, márgenes, descuentos ni demanda.
- `analyze_catalogue.py` produce `public_analysis.json`: excepciones clasificadas, reparación de serie en vista de reporting (56/60), sobrecoste A+B, valla IQR, parser ingenuo frente a parser con límites de palabra y la matriz del explorador web.
- `tests/test_public_case.py` (16 pruebas) vuelve a ejecutar ambos scripts y comprueba que los bytes no cambian, y recalcula las cifras clave por una vía independiente.
- Un campo vacío significa **no indicado**, nunca «no».

```bash
cd 02_PUBLIC_CASE_STUDY
python generate_independent_dataset.py
python analyze_catalogue.py
python -m unittest discover -s tests -v
```

Cifras: 362 registros · 12 series · 68 grupos (8 de un solo nivel) · 60 comparables · 54 estables (90,0 %) · 6 excepciones = 4 Starter + 2 registros mal archivados · 56/60 (93,3 %) tras reubicarlos · 24/24 parejas con y sin soluciones al mismo precio · media 44,04 €.
