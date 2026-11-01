# tpFoyer – frontend Angular

Interface web de l’API Spring Boot tpFoyer (Angular 21, composants standalone, Vitest).

## Développement

Prérequis : Node.js 22.12 ou plus récent, et l’API lancée en local sur le port 8082.

```bash
npm install
npm start          # http://localhost:4200, /tpFoyer17 est redirigé vers http://localhost:8082 (proxy.conf.json)
npm test           # tests unitaires (Vitest)
npm run build      # fichiers de production dans dist/frontend/browser
```

## Image Docker

`Dockerfile` en deux étapes :

1. **Node** : `npm ci`, tests unitaires, `npm run build` (l’image n’est pas construite si un test échoue).
2. **Nginx** : sert les fichiers Angular et transmet `/tpFoyer17/` (API et Swagger) à `BACKEND_URL`
   (par défaut `http://tpfoyer:80`, le Service Kubernetes de l’API). Le navigateur ne voit qu’une seule adresse :
   pas besoin de CORS.

```bash
docker build -t tpfoyer-frontend frontend
docker run -p 8080:80 -e BACKEND_URL=http://<api>:8082 tpfoyer-frontend
```

## Organisation

| Dossier | Contenu |
|---|---|
| `src/app/core` | modèles JSON de l’API, un service HTTP par ressource, messages d’erreur |
| `src/app/shared` | page CRUD générique (formulaire + tableau), configurée par ressource |
| `src/app/features` | une page par ressource : accueil, universités, foyers, blocs, chambres, étudiants, réservations |
| `nginx/` | configuration Nginx (fichiers Angular + proxy vers l’API) |
