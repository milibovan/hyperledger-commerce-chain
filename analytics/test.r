# install.packages("sparklyr")

library(sparklyr)
spark_install()

sc <- spark_connect(master = "local")

spark_web(sc)
# spark_disconnect(sc)