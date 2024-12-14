Ce petit site récupère les données ouvertes des compteurs de passages à vélo de la ville de Paris pour en faire une présentation synthétique.

En particulier on peut :

- Comparer les principaux compteurs
- Pour un compteur donné, voir les chiffre par heure de la veille, par jour du dernier mois, ou par semaine sur l’année en cours

## Obtenir les données

Des capteur (« boucles ») sont installées au sein du goudron un peu partout dans Paris. Cette boucle détecte le passage d’un vélo et remonte la donnée qui est exposée sur le portail OpenData de la Ville.

Elles sont mise à jour une fois par jour et découpées en deux fichiers :

Le premier qui contient les données de comptage à proprement parler (une mesure par heure et par compteur) :
`wget "https://parisdata.opendatasoft.com/api/v2/catalog/datasets/comptage-velo-donnees-compteurs/exports/csv?rows=-1&select=id_compteur%2Csum_counts%2Cdate&timezone=UTC" -O public/compteurs.csv`

Le deuxième contient des informations supplémentaire sur chaque compteur (comme une photo du compteur, son emplacement…)
`wget "https://parisdata.opendatasoft.com/api/v2/catalog/datasets/comptage-velo-compteurs/exports/csv" -O public/metadata.csv`

## Lancer le projet

C’est un projet [Next.js](https://nextjs.org/) et [Vega-Lite](https://vega.github.io/) pour dessiner les graphes.

La carte utilise [Mapbox](https://mapbox.com) et un _token_ est nécessaire.
Obtenez-en un et modifiez `.env.local.example` en le sauvegardant sous `.env.local`.

Vous aurez besoin d’une installation de [Node.js](https://nodejs.org/)

```bash
npm install
```

Afin de ne pas dépendre d’une base de données, les données sont préparées et intégrées statique à chaque page.

Pour préparer les données, nous utilisons duckdb :

```bash
duckdb compteurs.duckdb < prepare.sql
```

Et enfin pour lancer le projet :

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur pour voir le résultat.

## Déployer le projet

Afin de maintenir le site à jour, il faut reconstruire le site à chaque jour avec l’arrivée de nouvelles données (entre 8 et 9h du matin).

Téléchargez les données:

```bash
make metadata
make data
```

Exécutez :

```bash
duckdb compteurs.duckdb < prepare.sql
npm run build
```

Le repertoire `out` contiendra les fichier statiques à transférer sur le serveur web (celui-ci doit juste servir les fichiers. Il n’y a pas besoin d’avoir la moindre installation locale).
