-- Construit un parquet unique contenant tout l’historique des compteurs vélo :
-- * les exports annuels 2016-2025 de tmp_data/ ;
-- * les données quotidiennes de l’année en cours, limitées à 2026.
--
-- Les exports sont hétérogènes : encodage, délimiteur, format de date et de
-- nombre changent d’une année à l’autre. Ce script absorbe ces différences
-- pour produire un fichier unique au grain compteur × heure.
--
-- Utilisation :
--   duckdb < historique.sql
--
-- Le résultat est écrit dans
-- comptage-velo-donnees-compteurs.historique.parquet

-- Un SELECT par année : chaque export a ses propres particularités.
-- Les colonnes sont volontairement lues en texte, puis normalisées plus bas.
CREATE OR REPLACE VIEW history_raw AS
    SELECT
        "Identifiant du compteur" AS id_compteur,
        "Nom du compteur" AS nom_compteur,
        "Identifiant du site de comptage" AS id_site,
        "Nom du site de comptage" AS nom_site,
        "Comptage horaire" AS sum_counts,
        "Date et heure de comptage" AS date_comptage,
        "Date d'installation du site de comptage" AS installation_date,
        "Lien vers photo du site de comptage" AS photo_url,
        "Coordonnées géographiques" AS coordinates,
    FROM read_csv(
        'tmp_data/2016_comptage-velo-donnees-compteurs.csv',
        delim = ';', quote = '"', header = true,
        all_varchar = true, null_padding = true
    )
UNION ALL
    SELECT
        "Identifiant du compteur",
        "Nom du compteur",
        "Identifiant du site de comptage",
        "Nom du site de comptage",
        "Comptage horaire",
        "Date et heure de comptage",
        "Date d'installation du site de comptage",
        "Lien vers photo du site de comptage",
        "Coordonnées géographiques",
    FROM read_csv(
        'tmp_data/2017_comptage-velo-donnees-compteurs.csv',
        delim = ';', quote = '"', header = true,
        all_varchar = true, null_padding = true
    )
UNION ALL
    SELECT
        "Identifiant du compteur",
        "Nom du compteur",
        "Identifiant du site de comptage",
        "Nom du site de comptage",
        "Comptage horaire",
        "Date et heure de comptage",
        "Date d'installation du site de comptage",
        "Lien vers photo du site de comptage",
        "Coordonnées géographiques",
    FROM read_csv(
        'tmp_data/2018_comptage-velo-donnees-compteurs.csv',
        delim = ';', quote = '"', header = true,
        all_varchar = true, null_padding = true
    )
UNION ALL
    SELECT
        "Identifiant du compteur",
        "Nom du compteur",
        "Identifiant du site de comptage",
        "Nom du site de comptage",
        "Comptage horaire",
        "Date et heure de comptage",
        "Date d'installation du site de comptage",
        "Lien vers photo du site de comptage",
        "Coordonnées géographiques",
    FROM read_csv(
        'tmp_data/2019_comptage-velo-donnees-compteurs.csv',
        delim = ';', quote = '"', header = true,
        all_varchar = true, null_padding = true
    )
UNION ALL
    SELECT
        "Identifiant du compteur",
        "Nom du compteur",
        "Identifiant du site de comptage",
        "Nom du site de comptage",
        "Comptage horaire",
        "Date et heure de comptage",
        "Date d'installation du site de comptage",
        "Lien vers photo du site de comptage",
        "Coordonnées géographiques",
    FROM read_csv(
        'tmp_data/2020_comptage-velo-donnees-compteurs.csv',
        delim = ';', quote = '"', header = true,
        all_varchar = true, null_padding = true
    )
UNION ALL
    SELECT
        "Identifiant du compteur",
        "Nom du compteur",
        "Identifiant du site de comptage",
        "Nom du site de comptage",
        "Comptage horaire",
        "Date et heure de comptage",
        "Date d'installation du site de comptage",
        "Lien vers photo du site de comptage",
        "Coordonnées géographiques",
    FROM read_csv(
        'tmp_data/2021_comptage-velo-donnees-compteurs.csv',
        delim = ';', quote = '"', header = true,
        all_varchar = true, null_padding = true
    )
UNION ALL
    SELECT
        "Identifiant du compteur",
        "Nom du compteur",
        "Identifiant du site de comptage",
        "Nom du site de comptage",
        "Comptage horaire",
        "Date et heure de comptage",
        "Date d'installation du site de comptage",
        "Lien vers photo du site de comptage",
        "Coordonnées géographiques",
    FROM read_csv(
        'tmp_data/2022_comptage-velo-donnees-compteurs.csv',
        delim = ';', quote = '"', header = true,
        all_varchar = true, null_padding = true
    )
UNION ALL
    -- 2023 : BOM en tête, 17 colonnes (on ne garde que les 9 premières) et
    -- dates avec fuseau horaire (+01:00).
    SELECT
        "Identifiant du compteur",
        "Nom du compteur",
        "Identifiant du site de comptage",
        "Nom du site de comptage",
        "Comptage horaire",
        "Date et heure de comptage",
        "Date d'installation du site de comptage",
        "Lien vers photo du site de comptage",
        "Coordonnées géographiques",
    FROM read_csv(
        'tmp_data/2023_comptage-velo-donnees-compteurs.csv',
        delim = ';', quote = '"', header = true,
        all_varchar = true, null_padding = true
    )
UNION ALL
    -- 2024 : champs entre guillemets et dates « 2024-01-02 19:00:00.000 +0100 ».
    SELECT
        "Identifiant du compteur",
        "Nom du compteur",
        "Identifiant du site de comptage",
        "Nom du site de comptage",
        "Comptage horaire",
        "Date et heure de comptage",
        "Date d'installation du site de comptage",
        "Lien vers photo du site de comptage",
        "Coordonnées géographiques",
    FROM read_csv(
        'tmp_data/2024-comptage-velo-donnees-compteurs.csv',
        delim = ';', quote = '"', header = true,
        all_varchar = true, null_padding = true
    )
UNION ALL
    -- 2025 : encodage latin-1, délimiteur virgule, espaces insécables dans
    -- certains nombres (« 9 986 »), même format de date que 2024.
    SELECT
        "Identifiant du compteur",
        "Nom du compteur",
        "Identifiant du site de comptage",
        "Nom du site de comptage",
        "Comptage horaire",
        "Date et heure de comptage",
        "Date d'installation du site de comptage",
        "Lien vers photo du site de comptage",
        "Coordonnées géographiques",
    FROM read_csv(
        'tmp_data/2025-comptage-velo-donnees-compteurs.csv',
        delim = ',', quote = '"', header = true,
        all_varchar = true, null_padding = true, encoding = 'latin-1'
    );

-- Données quotidiennes : les 13 derniers mois. On ne garde que 2026, car
-- l'historique annuel couvre déjà 2016-2025. Il n'y a donc pas de
-- chevauchement à dédupliquer.
--
-- Attention : `date` est un TIMESTAMPTZ (UTC dans ce fichier), alors que
-- l'historique est en heure locale naïve. On convertit donc en heure de
-- Paris pour que les deux parties soient homogènes.
CREATE OR REPLACE VIEW daily_2026 AS
    SELECT
        id_compteur,
        nom_compteur,
        CAST(id AS VARCHAR) AS id_site,
        name AS nom_site,
        CAST(round(sum_counts) AS BIGINT) AS sum_counts,
        timezone('Europe/Paris', date) AS date_comptage,
        CAST(installation_date AS VARCHAR) AS installation_date,
        url_photos_n1 AS photo_url,
        -- Le quotidien expose une géométrie WKT « POINT (lon lat) ».
        -- On la convertit au format historique « lat,lon ».
        CASE
            WHEN coordinates IS NULL THEN NULL
            ELSE
                regexp_extract(CAST(coordinates AS VARCHAR), 'POINT \(([-0-9.]+) ([-0-9.]+)\)', 2)
                || ','
                || regexp_extract(CAST(coordinates AS VARCHAR), 'POINT \(([-0-9.]+) ([-0-9.]+)\)', 1)
        END AS coordinates,
    FROM read_parquet('tmp_data/comptage-velo-donnees-compteurs.parquet')
    WHERE date_part('year', timezone('Europe/Paris', date)) = 2026;

-- Les exports 2018 et 2019 contiennent, au passage à l'heure d'été, deux
-- lignes pour le même compteur et la même heure locale (par exemple
-- 2018-03-25 03:00:00). On conserve ces deux lignes : ce sont deux mesures
-- distinctes de la source, et leur somme au niveau du site reste correcte.
CREATE OR REPLACE VIEW history AS
    SELECT
        id_compteur,
        nom_compteur,
        id_site,
        nom_site,
        -- Les compteurs sont entiers, mais certains exports les écrivent
        -- « 155.0 » et d’autres « 9 986 » (espace insécable).
        CAST(
            round(
                try_cast(
                    regexp_replace(sum_counts, '[^0-9.-]', '', 'g') AS DOUBLE
                )
            ) AS BIGINT
        ) AS sum_counts,
        -- Les dates sont locales (heure de Paris). On supprime le fuseau
        -- horaire quand il est présent, pour obtenir un TIMESTAMP naïf
        -- homogène d’une année à l’autre.
        try_cast(
            replace(
                regexp_replace(trim(date_comptage), '\s*[+-][0-9]{2}:?[0-9]{2}$', ''),
                'T', ' '
            ) AS TIMESTAMP
        ) AS date_comptage,
        installation_date,
        photo_url,
        coordinates,
    FROM history_raw
UNION ALL
    SELECT
        id_compteur,
        nom_compteur,
        id_site,
        nom_site,
        sum_counts,
        date_comptage,
        installation_date,
        photo_url,
        coordinates,
    FROM daily_2026;

COPY (
    SELECT
        id_compteur AS "Identifiant du compteur",
        nom_compteur AS "Nom du compteur",
        id_site AS "Identifiant du site de comptage",
        nom_site AS "Nom du site de comptage",
        sum_counts AS "Comptage horaire",
        date_comptage AS "Date et heure de comptage",
        installation_date AS "Date d'installation du site de comptage",
        photo_url AS "Lien vers photo du site de comptage",
        coordinates AS "Coordonnées géographiques",
    FROM history
    WHERE date_comptage IS NOT NULL
) TO 'comptage-velo-donnees-compteurs.historique.parquet' (
    FORMAT parquet,
    COMPRESSION zstd
);
