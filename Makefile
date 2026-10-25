data:
	mkdir -p tmp_data
	wget "https://parisdata.opendatasoft.com/api/v2/catalog/datasets/comptage-velo-donnees-compteurs/exports/parquet?rows=-1&timezone=Europe%2FParis" -O tmp_data/comptage-velo-donnees-compteurs.parquet
multimodal:
	wget "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/comptage-multimodal-comptages/exports/parquet?lang=fr&timezone=Europe%2FParis" -O public/comptage-multimodal-comptages.parquet
.PHONY: data metadata multimodal
