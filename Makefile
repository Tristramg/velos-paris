data:
	wget "https://parisdata.opendatasoft.com/api/v2/catalog/datasets/comptage-velo-donnees-compteurs/exports/csv?rows=-1&select=id_compteur%2Csum_counts%2Cdate&timezone=UTC" -O public/compteurs.csv
metadata:
	wget "https://parisdata.opendatasoft.com/api/v2/catalog/datasets/comptage-velo-compteurs/exports/csv" -O public/metadata.csv
multimodal:
	wget "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/comptage-multimodal-comptages/exports/parquet?lang=fr&timezone=Europe%2FParis" -O public/comptage-multimodal-comptages.parquet
.PHONY: data metadata
