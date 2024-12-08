-- We get two datasets from Paris’ opendata
-- * metadata.csv that has one line per counter identified by `id_compteur`
-- * compteurs.csv that has the number of cyclists for each counter
--
-- Each counter (called “channel”) is a physical apparatus on the road
-- They are often in pairs that are identified by `name`
-- We separate them into `single_counter` and `counter_group`

CREATE TABLE single_counter AS
    SELECT * FROM read_csv('public/metadata.csv');

ALTER TABLE single_counter ADD COLUMN longitude FLOAT8;
ALTER TABLE single_counter ADD COLUMN latitude FLOAT8;

UPDATE single_counter SET
    longitude = coordinates.string_split(',')[2],
    latitude = coordinates.string_split(',')[1];

CREATE INDEX single_counter_idx ON single_counter(id_compteur);

-- Fix Some channel names
UPDATE single_counter
    SET channel_name = channel_name
        .replace('185 rue de Bercy ', '')
        .replace('27 quai de la Tournelle Vélos ', '')
        .replace('29 boulevard des Batignolles ', '')
        .replace('63 boulevard des Invalides Vélos ', '')
        .replace('Face au 8 avenue de la Porte de Châtillon ', '')
        .replace('Face au 48 quai de la marne Vélos ', '')
        .replace('Face au 8 avenue de la Porte de Châtillon Vélos ', '')
        .replace('Face au 81 Quai d''Orsay Vélos ', '')
        .replace('Quai des Tuileries Vélos ', '')
        .replace('Totem 64 Rue de Rivoli Vélos ', '')
        .replace('''', '’')
        .trim(),
        name = name
        .replace('Face au ', '')
        .replace('Face ', '')
        .replace('''', '’')
        .regexp_replace('^\d+', '')
        .trim();

-- Define the aggregations we want: a group can have multiple counters, like one for each direction
CREATE TABLE counter_group AS
    SELECT
        name,
        name.lower().strip_accents().replace(' ', '-').replace('’', '') as slug,
        avg(longitude) as longitude,
        avg(latitude) as latitude,
        any_value(url_photos_n1) as url_photo,
        any_value(installation_date) as installation_date,
        (sum(sum_counts) FILTER (date.date_add(INTERVAL 1 DAY) > current_date))::INTEGER as yesterday,
        (sum(sum_counts) FILTER (date.date_add(INTERVAL 7 DAY) > current_date))::INTEGER as week,
        (sum(sum_counts) FILTER (date.date_add(INTERVAL 30 DAY) > current_date))::INTEGER as month,
        (sum(sum_counts) FILTER (extract('year' FROM date) = extract('year' FROM current_date)))::INTEGER as year,
        sum(sum_counts)::INTEGER as total,
        (current_date - date_trunc('year', current_date))::INTEGER as days_this_year,
        date_part('day', current_date - min(date))::INTEGER as days,
        array_agg(distinct channel_name) as single_counters,
    FROM single_counter
    JOIN 'public/compteurs.csv' AS counts ON single_counter.id_compteur = counts.id_compteur
    GROUP BY name, slug;

-- Create a table by timespan we want to represent
-- The dates are exported as text because it will be serialized as json
CREATE TABLE hourly AS
    SELECT
        id_compteur,
        sum_counts::INTEGER as sum_counts,
        strftime(date, '%Y-%m-%dT%H:%M:%S') as date,
    FROM 'public/compteurs.csv' AS counts
    WHERE date.date_add(INTERVAL 2 DAY) > current_date; 

CREATE INDEX hourly_idx ON hourly(id_compteur);

CREATE TABLE daily AS
    SELECT
        id_compteur,
        sum(sum_counts)::INTEGER AS sum_counts,
        date_trunc('day', date)::TEXT as date,
    FROM 'public/compteurs.csv'
    GROUP BY id_compteur, date_trunc('day', date);

CREATE INDEX daily_idx ON daily(id_compteur);

CREATE TABLE weekly AS
    SELECT
        id_compteur,
        sum(sum_counts)::INTEGER AS sum_counts,
        date_trunc('week', date)::TEXT as date
    FROM 'public/compteurs.csv'
    GROUP BY id_compteur, date_trunc('week', date);

CREATE INDEX weekly_idx ON weekly(id_compteur);

-- Create some view to facilitate the querying

CREATE VIEW hourly_view AS
    SELECT hourly.*, channel_name, slug
    FROM hourly
    JOIN single_counter ON single_counter.id_compteur = hourly.id_compteur
    JOIN counter_group ON single_counter.name = counter_group.name;

CREATE VIEW daily_view AS
    SELECT daily.*, channel_name, slug
    FROM daily
    JOIN single_counter ON single_counter.id_compteur = daily.id_compteur
    JOIN counter_group ON single_counter.name = counter_group.name;

CREATE VIEW weekly_view AS
    SELECT weekly.*, channel_name, slug
    FROM weekly
    JOIN single_counter ON single_counter.id_compteur = weekly.id_compteur
    JOIN counter_group ON single_counter.name = counter_group.name;

-- Now that we have the data by time period let’s store the records for every period
CREATE VIEW records AS
    WITH
        hourly_by_group AS (SELECT SUM(sum_counts)::INTEGER as count, slug, date FROM hourly_view GROUP BY slug, date),
        daily_by_group AS (SELECT SUM(sum_counts)::INTEGER as count, slug, date FROM daily_view GROUP BY slug, date),
        weekly_by_group AS (SELECT SUM(sum_counts)::INTEGER as count, slug, date FROM weekly_view GROUP BY slug, date)
    SELECT
        counter_group.slug,
        ARGMAX(hourly_by_group.date, hourly_by_group.count) AS hour_record_date, max(hourly_by_group.count) AS hour_record,
        ARGMAX(daily_by_group.date, daily_by_group.count) AS day_record_date, max(daily_by_group.count) AS day_record,
        ARGMAX(weekly_by_group.date, weekly_by_group.count) AS week_record_date, max(weekly_by_group.count) AS week_record,
    FROM counter_group
    LEFT JOIN hourly_by_group ON counter_group.slug = hourly_by_group.slug
    LEFT JOIN daily_by_group ON counter_group.slug = daily_by_group.slug
    LEFT JOIN weekly_by_group ON counter_group.slug = weekly_by_group.slug
    GROUP BY counter_group.slug;