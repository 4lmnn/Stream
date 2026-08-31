# Herramientas para TU desarrollo; no es un servicio del aula.
FROM node:24-bookworm-slim AS tooling
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
# Tu carpeta se monta aquí; las dependencias permanecen en /app/node_modules.
# Node/Vite resuelven las dependencias en el directorio superior.
WORKDIR /app/project
ENV PATH="/app/node_modules/.bin:${PATH}"
CMD ["npm", "run", "watch"]

# Imagen para el profesor. Compila TU frontend antes de reconstruir esta imagen.
FROM nginx:1.28-alpine AS web
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY dist/ /srv/aula/
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]

FROM bluenviron/mediamtx:1.20.1 AS media
COPY mediamtx/mediamtx.yml /mediamtx.yml
