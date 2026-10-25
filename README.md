Ce petit site récupère les données ouvertes des compteurs de passages à vélo de la ville de Paris pour en faire une présentation synthétique.

En particulier on peut :

- Comparer les principaux compteurs
- Pour un compteur donné, voir les chiffre par heure de la veille, par jour du dernier mois, ou par semaine sur l'année en cours

## Obtenir les données

Des capteur (« boucles ») sont installées au sein du goudron un peu partout dans Paris. Cette boucle détecte le passage d'un vélo et remonte la donnée qui est exposée sur le portail OpenData de la Ville.

Elles sont mises à jour une fois par jour. Le pré-traitement utilise :

- le parquet quotidien des 13 derniers mois, téléchargé dans `tmp_data/` :
  `make data`
- une archive parquet de l’historique 2016-2025, lue directement en HTTP :
  `https://storage.tristramg.eu/velo/comptage-velo-donnees-compteurs.2016-2025.parquet`

L’archive annuelle est mise à jour une fois par an. Les données quotidiennes
ne sont conservées que pour l’année en cours lors de la préparation.

## Lancer le projet

C'est un projet [Astro](https://astro.build/) et [Vega-Lite](https://vega.github.io/) pour dessiner les graphes.

La carte utilise [Maplible](https://maplbire.org) avec les tuiles fournies par [Tuiles en liberté](https://tuiles.enliberte.fr/).

Vous aurez besoin d'une installation de [Node.js](https://nodejs.org/)

```bash
npm install
```

Afin de ne pas dépendre d'une base de données, les données sont préparées et intégrées statique à chaque page.

Pour préparer les données, nous utilisons duckdb :

```bash
duckdb compteurs.duckdb < prepare.sql
```

Et enfin pour lancer le projet :

```bash
npm run dev
```

Ouvrez [http://localhost:4321](http://localhost:4321) dans votre navigateur pour voir le résultat.

## Déployer le projet

Afin de maintenir le site à jour, il faut reconstruire le site à chaque jour avec l'arrivée de nouvelles données (entre 8 et 9h du matin).

Téléchargez les données quotidiennes :

```bash
make data
```

Exécutez :

```bash
duckdb compteurs.duckdb < prepare.sql
npm run build
```

Le repertoire `dist` contiendra les fichier statiques à transférer sur le serveur web (celui-ci doit juste servir les fichiers. Il n'y a pas besoin d'avoir la moindre installation locale).
