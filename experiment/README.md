# Експеримент із витоком поля

    cp src/app.ts experiment/app.original.ts
    cp experiment/app.leak.ts src/app.ts
    npm test
    # знімок екрана
    cp experiment/app.original.ts src/app.ts
    npm test
