-- Les données de comptage viennent de deux sources :
-- * l’archive historique 2016-2025, lue directement en HTTP ;
-- * le parquet quotidien des 13 derniers mois, dont on ne garde que les dates
--   postérieures à l’archive.
--
-- L’archive annuelle est mise à jour une fois par an. Le parquet quotidien
-- est téléchargé à chaque préparation.
--
-- On conserve la distinction entre sites et compteurs :
-- * un site (`Identifiant du site de comptage`) peut contenir plusieurs
--   compteurs, par exemple l’un par sens de circulation ;
-- * les identifiants de compteurs changent parfois lors des reconfigurations,
--   mais l’identifiant de site reste stable. Les agrégats par site sont donc
--   calculés à partir de `id_site`, pas à partir des identifiants de compteur.
--
-- Certains sites publiés séparément mesurent en réalité la même voie (le plus
-- souvent un sens de circulation par site) ou portent le même nom à quelques
-- numéros près. `site_merges.csv` indique, pour chaque site à absorber, le
-- site qui le remplace : ces sites sont alors traités comme un seul et même
-- site dans tout le fichier.
--
-- Les exports historiques sont en heure locale de Paris, sans fuseau. Les
-- données quotidiennes sont converties dans le même format ci-dessous.

-- Correspondances manuelles : `site_id` est le site absorbé,
-- `overridden_site_id` est le site qui le remplace et `override_name` écrase
-- le nom affiché du site fusionné (facultatif).
CREATE OR REPLACE VIEW site_merge AS
    SELECT
        site_id,
        overridden_site_id,
        override_name,
    FROM read_csv(
        'site_merges.csv',
        header = true,
        columns = {
            'site_id': 'VARCHAR',
            'overridden_site_id': 'VARCHAR',
            'override_name': 'VARCHAR'
        }
    );

-- Archive historique. DuckDB lit le parquet en HTTP par ranges : pas besoin
-- de le télécharger intégralement sur disque.
CREATE OR REPLACE VIEW archive AS
    SELECT
        "Identifiant du compteur" AS id_compteur,
        "Nom du compteur" AS nom_compteur,
        "Identifiant du site de comptage" AS id_site_brut,
        coalesce(
            site_merge.overridden_site_id,
            "Identifiant du site de comptage"
        ) AS id_site,
        site_merge.override_name AS override_name,
        "Nom du site de comptage" AS nom_site,
        "Comptage horaire"::BIGINT AS sum_counts,
        "Date et heure de comptage" AS date,
        "Date d'installation du site de comptage" AS installation_date,
        "Lien vers photo du site de comptage" AS photo_url,
        "Coordonnées géographiques" AS coordinates,
    FROM read_parquet(
        'https://storage.tristramg.eu/velo/comptage-velo-donnees-compteurs.2016-2025.parquet'
    )
    LEFT JOIN site_merge
        ON site_merge.site_id = "Identifiant du site de comptage"
    WHERE "Identifiant du site de comptage" IS NOT NULL
      AND "Identifiant du compteur" IS NOT NULL
      AND "Comptage horaire" IS NOT NULL;

-- Données quotidiennes postérieures à l’archive. Le parquet quotidien couvre
-- 13 mois et chevauche donc la fin de l’archive : on ne garde que les dates
-- strictement postérieures à sa dernière mesure.
-- `date` est un TIMESTAMPTZ : on le convertit en heure locale de Paris.
CREATE OR REPLACE VIEW quotidien AS
    SELECT
        id_compteur,
        nom_compteur,
        CAST(id AS VARCHAR) AS id_site_brut,
        coalesce(site_merge.overridden_site_id, CAST(id AS VARCHAR)) AS id_site,
        site_merge.override_name AS override_name,
        name AS nom_site,
        CAST(round(sum_counts) AS BIGINT) AS sum_counts,
        timezone('Europe/Paris', date) AS date,
        CAST(installation_date AS VARCHAR) AS installation_date,
        url_photos_n1 AS photo_url,
        CASE
            WHEN coordinates IS NULL THEN NULL
            ELSE
                regexp_extract(CAST(coordinates AS VARCHAR), 'POINT \(([-0-9.]+) ([-0-9.]+)\)', 2)
                || ','
                || regexp_extract(CAST(coordinates AS VARCHAR), 'POINT \(([-0-9.]+) ([-0-9.]+)\)', 1)
        END AS coordinates,
    FROM read_parquet('tmp_data/comptage-velo-donnees-compteurs.parquet')
    LEFT JOIN site_merge ON site_merge.site_id = CAST(id AS VARCHAR)
    WHERE timezone('Europe/Paris', date) > (SELECT max(date) FROM archive)
      AND id IS NOT NULL
      AND id_compteur IS NOT NULL
      AND sum_counts IS NOT NULL;

CREATE OR REPLACE VIEW comptage AS
    SELECT * FROM archive
    UNION ALL
    SELECT * FROM quotidien;

-- Année de la donnée la plus récente. Elle sert à délimiter :
-- * les données « courantes » affichées dans les graphiques (année en cours) ;
-- * les chiffres historiques (années révolues).
CREATE OR REPLACE VIEW derniere_annee AS
    SELECT
        date_trunc('year', max(date)) AS debut_annee,
        max(date) AS derniere_date,
    FROM comptage;

CREATE OR REPLACE VIEW comptage_courant AS
    SELECT comptage.*
    FROM comptage, derniere_annee
    WHERE comptage.date >= derniere_annee.debut_annee;

-- Métadonnées des compteurs actifs cette année. On prend la dernière valeur
-- connue de chaque champ.
CREATE OR REPLACE VIEW compteur_metadata AS
    SELECT
        id_compteur,
        arg_max(id_site, date) AS id_site,
        arg_max(nom_compteur, date) AS nom_compteur,
        arg_max(nom_site, date) AS nom_site,
        -- L’archive stocke parfois plusieurs photos sous forme de liste Python
        -- (`['https://…', 'https://…']`). On ne garde que la première URL.
        arg_max(
            CASE
                WHEN photo_url LIKE '%''%'
                    THEN regexp_extract(photo_url, '''([^'']+)''', 1)
                ELSE photo_url
            END,
            date
        ) AS url_photo,
        arg_max(installation_date, date) AS installation_date,
        arg_max(coordinates, date) AS coordinates,
    FROM comptage_courant
    GROUP BY id_compteur;

-- Métadonnées des sites actifs cette année, une ligne par site effectif après
-- application de `site_merges.csv`. Pour un site fusionné, le nom peut être
-- écrasé par `override_name` (sinon on garde celui du site de référence,
-- `id_site_brut = id_site`), les coordonnées sont celles du site de référence,
-- et les canaux de tous les sites absorbés sont rassemblés.
CREATE OR REPLACE TABLE site_metadata AS
    WITH sites AS (
        SELECT
            id_site,
            coalesce(
                max(override_name),
                arg_max(
                    CASE WHEN id_site = id_site_brut THEN nom_site END,
                    date
                ),
                arg_max(nom_site, date)
            ) AS nom_site,
            coalesce(
                arg_max(
                    CASE WHEN id_site = id_site_brut THEN coordinates END,
                    date
                ),
                arg_max(coordinates, date)
            ) AS coordinates,
            min(installation_date) AS installation_date,
        FROM comptage_courant
        GROUP BY id_site
    ),
    canaux AS (
        SELECT
            id_site,
            array_agg(
                DISTINCT trim(
                    replace(nom_compteur, nom_site, '')
                )
            ) AS single_counters,
            string_agg(
                DISTINCT trim(
                    replace(nom_compteur, nom_site, '')
                ),
                ' / '
                ORDER BY trim(
                    replace(nom_compteur, nom_site, '')
                )
            ) AS canaux,
        FROM comptage_courant
        GROUP BY id_site
    ),
    nommes AS (
        SELECT
            sites.id_site,
            sites.nom_site,
            sites.coordinates,
            sites.installation_date,
            canaux.single_counters,
            -- Les sites qui portent encore le même nom après fusion (ponts
            -- avec un compteur de chaque côté) sont distingués par leurs sens.
            CASE
                WHEN count(*) OVER (PARTITION BY sites.nom_site) > 1
                    THEN sites.nom_site || ' (' || canaux.canaux || ')'
                ELSE sites.nom_site
            END AS name,
        FROM sites
        LEFT JOIN canaux USING (id_site)
    ),
    slugs AS (
        SELECT
            *,
            trim(
                regexp_replace(lower(strip_accents(name)), '[^a-z0-9]+', '-', 'g'),
                '-'
            ) AS base_slug,
        FROM nommes
    )
    SELECT
        id_site,
        name,
        nom_site,
        CASE
            WHEN count(*) OVER (PARTITION BY base_slug) > 1
                THEN base_slug || '-' || id_site
            ELSE base_slug
        END AS slug,
        trim(split_part(coordinates, ',', 2))::DOUBLE AS longitude,
        trim(split_part(coordinates, ',', 1))::DOUBLE AS latitude,
        installation_date,
        single_counters,
    FROM slugs;

CREATE OR REPLACE TABLE single_counter AS
    SELECT
        site_metadata.name,
        site_metadata.slug,
        compteur_metadata.id_compteur,
        CASE
            WHEN trim(
                replace(compteur_metadata.nom_compteur, compteur_metadata.nom_site, '')
            ) = ''
                THEN compteur_metadata.nom_compteur
            ELSE trim(
                replace(compteur_metadata.nom_compteur, compteur_metadata.nom_site, '')
            )
        END AS channel_name,
        compteur_metadata.nom_compteur,
        compteur_metadata.url_photo,
        compteur_metadata.installation_date,
        trim(split_part(compteur_metadata.coordinates, ',', 2))::DOUBLE AS longitude,
        trim(split_part(compteur_metadata.coordinates, ',', 1))::DOUBLE AS latitude,
    FROM compteur_metadata
    JOIN site_metadata USING (id_site);

CREATE INDEX IF NOT EXISTS single_counter_idx ON single_counter(id_compteur);

-- Agrégats par site effectif (après fusion des sites de `site_merges.csv`).
-- Les métriques récentes (hier, semaine, mois, année) et le total historique
-- sont volontairement séparés : le total couvre toute l’histoire disponible.
CREATE OR REPLACE TABLE counter_group AS
    WITH site_counts AS (
        SELECT
            comptage.id_site,
            comptage.date,
            comptage.sum_counts,
        FROM comptage
        JOIN site_metadata USING (id_site)
    ),
    agregats AS (
        SELECT
            id_site,
            (sum(sum_counts) FILTER (date + INTERVAL 1 DAY > current_date))::INTEGER AS yesterday,
            (sum(sum_counts) FILTER (date + INTERVAL 7 DAY > current_date))::INTEGER AS week,
            (sum(sum_counts) FILTER (date + INTERVAL 30 DAY > current_date))::INTEGER AS month,
            (sum(sum_counts) FILTER (date >= (SELECT debut_annee FROM derniere_annee)))::INTEGER AS year,
            sum(sum_counts)::INTEGER AS total,
            date_part('day', current_date - date_trunc('year', current_date))::INTEGER AS days_this_year,
            date_part('day', current_date - min(date))::INTEGER AS days,
        FROM site_counts
        GROUP BY id_site
    )
    SELECT
        site_metadata.name,
        site_metadata.slug,
        site_metadata.longitude,
        site_metadata.latitude,
        site_metadata.installation_date,
        agregats.yesterday,
        agregats.week,
        agregats.month,
        agregats.year,
        agregats.total,
        agregats.days_this_year,
        agregats.days,
        site_metadata.single_counters,
    FROM site_metadata
    JOIN agregats USING (id_site);

CREATE INDEX IF NOT EXISTS counter_group_idx ON counter_group(slug);

-- Données par compteur pour l’année en cours. C’est ce qui alimente les
-- graphiques heure / jour / semaine. On reste sur l’année en cours pour que
-- les identifiants de compteurs correspondent bien à ceux des sites affichés.
CREATE OR REPLACE TABLE hourly AS
    SELECT
        comptage_courant.id_compteur,
        comptage_courant.sum_counts::INTEGER AS sum_counts,
        strftime(comptage_courant.date, '%Y-%m-%dT%H:%M:%S') AS date,
    FROM comptage_courant
    JOIN single_counter USING (id_compteur)
    WHERE comptage_courant.date + INTERVAL 2 DAY > current_date;

CREATE INDEX IF NOT EXISTS hourly_idx ON hourly(id_compteur);

CREATE OR REPLACE TABLE daily AS
    SELECT
        comptage_courant.id_compteur,
        sum(comptage_courant.sum_counts)::INTEGER AS sum_counts,
        strftime(date_trunc('day', comptage_courant.date), '%Y-%m-%d') AS date,
    FROM comptage_courant
    JOIN single_counter USING (id_compteur)
    GROUP BY comptage_courant.id_compteur, date_trunc('day', comptage_courant.date);

CREATE INDEX IF NOT EXISTS daily_idx ON daily(id_compteur);

CREATE OR REPLACE TABLE weekly AS
    SELECT
        comptage_courant.id_compteur,
        sum(comptage_courant.sum_counts)::INTEGER AS sum_counts,
        strftime(date_trunc('week', comptage_courant.date), '%Y-%m-%d') AS date,
    FROM comptage_courant
    JOIN single_counter USING (id_compteur)
    GROUP BY comptage_courant.id_compteur, date_trunc('week', comptage_courant.date);

CREATE INDEX IF NOT EXISTS weekly_idx ON weekly(id_compteur);

-- Vues utilisées par les pages Astro.
CREATE OR REPLACE VIEW hourly_view AS
    SELECT hourly.*, channel_name, slug
    FROM hourly
    JOIN single_counter USING (id_compteur);

CREATE OR REPLACE VIEW daily_view AS
    SELECT daily.*, channel_name, slug
    FROM daily
    JOIN single_counter USING (id_compteur);

CREATE OR REPLACE VIEW weekly_view AS
    SELECT weekly.*, channel_name, slug
    FROM weekly
    JOIN single_counter USING (id_compteur);

-- Records sur toute l’histoire disponible, au grain site effectif. On agrège
-- d’abord par site × période, puis on prend le maximum : cela évite de
-- multiplier les lignes entre les trois granularités.
CREATE OR REPLACE TABLE records AS
    WITH site_counts AS (
        SELECT
            comptage.id_site,
            comptage.date,
            comptage.sum_counts,
        FROM comptage
        JOIN site_metadata USING (id_site)
    ),
    hourly_by_site AS (
        SELECT
            id_site,
            date,
            sum(sum_counts)::INTEGER AS count,
        FROM site_counts
        GROUP BY id_site, date
    ),
    daily_by_site AS (
        SELECT
            id_site,
            date_trunc('day', date) AS date,
            sum(sum_counts)::INTEGER AS count,
        FROM site_counts
        GROUP BY id_site, date_trunc('day', date)
    ),
    weekly_by_site AS (
        SELECT
            id_site,
            date_trunc('week', date) AS date,
            sum(sum_counts)::INTEGER AS count,
        FROM site_counts
        GROUP BY id_site, date_trunc('week', date)
    ),
    hourly_record AS (
        SELECT id_site, arg_max(date, count) AS date, max(count) AS count
        FROM hourly_by_site
        GROUP BY id_site
    ),
    daily_record AS (
        SELECT id_site, arg_max(date, count) AS date, max(count) AS count
        FROM daily_by_site
        GROUP BY id_site
    ),
    weekly_record AS (
        SELECT id_site, arg_max(date, count) AS date, max(count) AS count
        FROM weekly_by_site
        GROUP BY id_site
    )
    SELECT
        site_metadata.slug,
        -- Dates au format ISO : elles sont formatées côté Astro avec
        -- `DateTime.fromISO`.
        strftime(hourly_record.date, '%Y-%m-%dT%H:%M:%S') AS hour_record_date,
        hourly_record.count AS hour_record,
        strftime(daily_record.date, '%Y-%m-%dT%H:%M:%S') AS day_record_date,
        daily_record.count AS day_record,
        strftime(weekly_record.date, '%Y-%m-%dT%H:%M:%S') AS week_record_date,
        weekly_record.count AS week_record,
    FROM site_metadata
    LEFT JOIN hourly_record USING (id_site)
    LEFT JOIN daily_record USING (id_site)
    LEFT JOIN weekly_record USING (id_site);

-- `records` est une table (et non une vue) : sans cela, chaque page rejouait
-- l’agrégation des 10 millions de lignes de l’archive, soit ~500 ms par page.
CREATE INDEX IF NOT EXISTS records_idx ON records(slug);

-- Cumul journalier depuis le 1er janvier, au grain site effectif, pour
-- comparer les années entre elles. Les dates sont ramenées sur l’année 2024
-- (bissextile) afin que le 29 février existe et que toutes les courbes se
-- superposent : une même abscisse correspond au même jour du calendrier.
CREATE OR REPLACE TABLE cumulative AS
    WITH site_daily AS (
        SELECT
            site_metadata.slug,
            comptage.id_site,
            date_trunc('day', comptage.date) AS day,
            sum(comptage.sum_counts)::BIGINT AS count,
        FROM comptage
        JOIN site_metadata USING (id_site)
        GROUP BY site_metadata.slug, comptage.id_site, date_trunc('day', comptage.date)
    ),
    running AS (
        SELECT
            slug,
            day,
            date_part('year', day)::INTEGER AS year,
            sum(count) OVER (
                PARTITION BY id_site, date_part('year', day)
                ORDER BY day
            )::INTEGER AS cumulative,
        FROM site_daily
    )
    SELECT
        slug,
        year,
        strftime(
            make_date(
                2024,
                date_part('month', day)::INTEGER,
                date_part('day', day)::INTEGER
            ),
            -- Heure explicite : sans fuseau, Vega interprète la date en
            -- heure locale, comme la borne du domaine de l’axe des abscisses.
            '%Y-%m-%dT00:00:00'
        ) AS day,
        cumulative,
    FROM running;

CREATE INDEX IF NOT EXISTS cumulative_idx ON cumulative(slug);

-- Chiffres par année révolue, au grain site effectif. L’année en cours est
-- exclue : elle est déjà visible dans les métriques courantes et n’est pas
-- complète.
CREATE OR REPLACE TABLE yearly AS
    SELECT
        site_metadata.slug,
        sum(comptage.sum_counts)::BIGINT AS sum_counts,
        date_part('year', comptage.date)::INTEGER AS year,
    FROM comptage
    JOIN site_metadata USING (id_site)
    WHERE comptage.date < (SELECT debut_annee FROM derniere_annee)
    GROUP BY site_metadata.slug, date_part('year', comptage.date);

CREATE INDEX IF NOT EXISTS yearly_idx ON yearly(slug);
