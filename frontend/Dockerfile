# Image of the Angular front, built in several stages: only the last one is kept in the final image.
# Jenkins (stage FRONT TESTS) builds up to the "test" stage: Node and Chromium are in the image, not on Jenkins.

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
