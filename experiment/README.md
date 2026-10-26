# Експеримент з кроку 9: стан проти взаємодії

    cp src/order-service.ts experiment/order-service.original.ts
    cp experiment/order-service.two-saves.ts src/order-service.ts
    npm test
    # зробіть знімок екрана з результатом
    cp experiment/order-service.original.ts src/order-service.ts
    npm test
