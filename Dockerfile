FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Copiar el código fuente
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Exponer el puerto
EXPOSE 4000

# Comando de inicio
CMD ["npm", "run", "server:start"]
