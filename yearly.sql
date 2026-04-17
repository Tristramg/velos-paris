-- Historique de comptage
-- On aggrège par Année pour commiter le résultat fini
-- Le traitement global serait trop long, avec trop de données
-- Source: https://opendata.paris.fr/explore/dataset/comptage-velo-historique-donnees-compteurs/information/
-- Les données sont hétérogènes, il faut netoyer avant:
-- cat 2024-comptage-velo-donnees-compteurs.csv | sed -e "s/\(2024-..-..\) \(..:..:......\) ...../\\1T\\2/" > 2024_clean.csv
-- cut -f-9 -d";" 2023_comptage-velo-donnees-compteurs.csv > 2023_trimed.csv
-- iconv -f latin1 2025-comptage-velo-donnees-compteurs.csv  -t utf8 > 2025_utf8.csv
-- cat 2025_utf8.csv | sed -e "s/\(2025-..-..\) \(..:..:......\) ...../\\1T\\2/" > 2025_almost_clean.csv
-- cat 2025_almost_clean.csv | sed -e "s/,\([0-9]\+\)\xC2\xA0\([0-9]\+\),/,\\1\\2,/" > 2025_clean.csv
-- copy (select * FROM "2025.csv") to '2025_sep.csv' (DELIMITER ';');

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
    FROM "comptage-velo-donnees-compteurs.2016-2025.csv"
    GROUP BY name, date_part('year', "Date et heure de comptage"::date)::INTEGER;

COPY yearly TO 'yearly.tsv' (HEADER, DELIMITER '\t');
