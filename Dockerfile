FROM node:20-alpine

WORKDIR /app

# Copiar archivos de configuración de npm y dependencias
COPY .npmrc package.json package-lock.json* ./

# Instalamos todas las dependencias incluyendo dev para poder compilar el frontend
RUN npm install --legacy-peer-deps

# Copiar el código fuente
COPY . .

# Generar Prisma Client primero (necesario para el build del server)
RUN npx prisma generate

# Construir la PWA frontend
RUN npm run build

# Exponer el puerto
EXPOSE 4000

# Comando de inicio: corre las migraciones y luego inicia el servidor
CMD npx prisma migrate deploy && npm run server:start
