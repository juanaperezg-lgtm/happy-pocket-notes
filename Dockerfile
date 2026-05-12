FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package.json package-lock.json* ./
# Instalamos todas las dependencias incluyendo dev para poder compilar el frontend
RUN npm install

# Copiar el código fuente
COPY . .

# Construir la PWA frontend y generar Prisma Client
RUN npm run build
RUN npx prisma generate

# Exponer el puerto
EXPOSE 4000

# Comando de inicio: corre las migraciones y luego inicia el servidor
CMD npx prisma migrate deploy && npm run server:start
