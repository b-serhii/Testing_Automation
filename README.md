# Лабораторна робота № 1. Автоматизація тестування

Виконав: Бойог Сергій Степанович, група 4 ІПЗ.

## Структура проєкту

- `src/temperature.ts` – показовий модуль (°C → °F);
- `src/bmi.ts` – модуль за варіантом 2 (індекс маси тіла);
- `tests/` – тести Vitest для кожного модуля;
- `vitest.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc` – конфігурація.

## Встановлення та запуск

```bash
npm install
npm test            # одноразовий прогін
npm run test:watch  # режим спостереження
npm run coverage    # покриття (звіт у coverage/index.html)
npm run lint        # статичний аналіз
```
