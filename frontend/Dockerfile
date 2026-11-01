# Image of the Angular front, built in several stages: only the last one is kept in the final image.
# Jenkins (stage FRONT TESTS) builds up to the "test" stage: Node and Chromium are in the image, not on Jenkins.
# Jenkins (stage BUILDING FRONT IMAGE) builds the final image: "final" does not depend on "test",
# so BuildKit skips the tests there (they already ran) and reuses "deps" from the cache.

# ---------- deps: npm packages ----------
# Docker keeps this layer in cache as long as package.json and package-lock.json do not change
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------- test: the unit and integration tests of the front ----------
# A failing test makes "docker build" fail, so the Jenkins stage fails too.
# Reports: /app/reports/junit (JUnit XML for Jenkins) and /app/reports/coverage (lcov)
FROM deps AS test
RUN apk add --no-cache chromium
ENV CHROME_BIN=/usr/bin/chromium-browser
COPY . .
RUN npx ng test --watch=false --browsers=ChromeHeadlessCI --code-coverage

# ---------- build: Angular compiled in production mode ----------
# Result: static files (index.html, *.js, *.css) in /app/dist/frontend/browser
FROM deps AS build
COPY . .
RUN npx ng build --configuration production

# ---------- final: the image pushed to Docker Hub (Nginx only: no Node, no node_modules) ----------
FROM nginx:1.27-alpine
# At start-up, the Nginx image copies the templates to /etc/nginx/conf.d/ and replaces ${API_URL}
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
# The back on EKS: its ClusterIP Service "tpfoyer" (port 8082). Changed with -e API_URL=... elsewhere
ENV API_URL=http://tpfoyer:8082
EXPOSE 80
