-- Historique de comptage
-- On aggrège par Année pour commiter le résultat fini
-- Le traitement global serait trop long, avec trop de données
-- Source: https://opendata.paris.fr/explore/dataset/comptage-velo-historique-donnees-compteurs/information/
-- Les données sont hétérogènes, il faut netoyer avant:
-- cat 2024-comptage-velo-donnees-compteurs.csv | sed -e "s/\(2024-..-..\) \(..:..:......\) ...../\\1T\\2/" > 2024_clean.csv
-- cut -f-9 -d";" 2023_comptage-velo-donnees-compteurs.csv > 2023_trimed.csv

CREATE TABLE yearly(
    name TEXT,
    sum_counts INTEGER,
    year INTEGER
);

INSERT INTO yearly(name, sum_counts, year)
    SELECT
        -- "Identifiant du site de comptage" n’est pas stable d’une année à l’autre
        "Nom du site de comptage".replace('Face au ', '')
        .replace('Face ', '')
        .replace('Totem', '')
        .replace('''', '’')
        .regexp_replace('^\d+', '')
        .trim() as name,
        SUM("Comptage horaire"),
        date_part('year', "Date et heure de comptage"::date)::INTEGER
    FROM "comptage-velo-donnees-compteurs.2016-2024.csv"
    GROUP BY name, date_part('year', "Date et heure de comptage"::date)::INTEGER;

COPY yearly TO 'yearly.tsv' (HEADER, DELIMITER '\t');
