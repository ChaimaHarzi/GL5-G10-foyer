# Stage 1: install, test and build the Angular application with Node.
# Jenkins needs no Node.js: everything happens inside "docker build".
FROM node:22-alpine AS build

WORKDIR /app

# Dependencies first: this layer is reused as long as package*.json do not change
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# The image is not built if a unit test fails
RUN npm test -- --watch=false
RUN npm run build

# Stage 2: only the built files, served by Nginx (no Node, no sources in the final image)
FROM nginx:1.29-alpine

# Where Nginx forwards the API calls (/tpFoyer17/...): the backend Service in Kubernetes.
# The official Nginx image puts this value in the templates of /etc/nginx/templates at start-up.
ENV BACKEND_URL=http://tpfoyer:80

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80
