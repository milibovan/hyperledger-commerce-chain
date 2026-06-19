# install.packages("sparklyr")

library(sparklyr)
library(DBI)
library(dplyr)
library(ggplot2)
# library(dbplot)

spark_install(version = "3.3")

conf <- spark_config()

conf$`spark.sql.ansi.enabled` <- "true"

sc <- spark_connect(master = "local", version = "3.3", config = conf)

Sys.setenv(HADOOP_HOME = "C:/Hadoop")

# sc <- spark_connect(master = "local", version = "3.3")
# spark_web(sc)

csv <- spark_read_csv(sc, "test_data", "file:///C:/Users/MiliBovan/Desktop/master/hyperledger-commerce-chain/analytics/data-generator/orders.csv")
# json <- spark_read_json(sc, "test_data", "file:///C:/Users/MiliBovan/Desktop/master/hyperledger-commerce-chain/analytics/data-generator/orders.jsonl")
csv


# spark_disconnect(sc)