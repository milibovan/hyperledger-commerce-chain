FROM flink:1.20.0

USER root
RUN apt-get update -y && \
    apt-get install -y python3 python3-pip python3-dev wget && \
    rm -rf /var/lib/apt/lists/*

RUN ln -s /usr/bin/python3 /usr/bin/python

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
RUN uv pip install --system --break-system-packages apache-flink==1.20.0

RUN wget -P /opt/flink/lib/ https://repo1.maven.org/maven2/org/apache/flink/flink-sql-parquet/1.20.0/flink-sql-parquet-1.20.0.jar && \
    wget -P /opt/flink/lib/ https://repo1.maven.org/maven2/org/apache/hadoop/hadoop-client-api/3.3.4/hadoop-client-api-3.3.4.jar && \
    wget -P /opt/flink/lib/ https://repo1.maven.org/maven2/org/apache/hadoop/hadoop-client-runtime/3.3.4/hadoop-client-runtime-3.3.4.jar && \
    wget -P /opt/flink/lib/ https://repo1.maven.org/maven2/com/fasterxml/woodstox/woodstox-core/6.5.1/woodstox-core-6.5.1.jar && \
    wget -P /opt/flink/lib/ https://repo1.maven.org/maven2/org/codehaus/woodstox/stax2-api/4.2.1/stax2-api-4.2.1.jar && \
    wget -P /opt/flink/lib/ https://repo1.maven.org/maven2/commons-logging/commons-logging/1.2/commons-logging-1.2.jar && \
    wget -P /opt/flink/lib/ https://repo.maven.apache.org/maven2/org/apache/flink/flink-connector-jdbc-postgres/3.3.0-1.20/flink-connector-jdbc-postgres-3.3.0-1.20.jar

RUN wget -P /opt/flink/lib/ https://repo.maven.apache.org/maven2/org/apache/flink/flink-connector-jdbc/3.3.0-1.20/flink-connector-jdbc-3.3.0-1.20.jar

RUN wget -P /opt/flink/lib/ https://jdbc.postgresql.org/download/postgresql-42.7.9.jar

RUN mkdir -p /opt/flink/log && chown -R flink:flink /opt/flink/log /opt/flink/lib

RUN mkdir -p /opt/flink/opt && \
    cp /opt/flink/lib/flink-connector-jdbc-3.3.0-1.20.jar /opt/flink/opt/ && \
    cp /opt/flink/lib/postgresql-42.7.9.jar /opt/flink/opt/

ENV HADOOP_CONF_DIR=/opt/hadoop/etc/hadoop
ENV HADOOP_CLASSPATH="/opt/hadoop/etc/hadoop:/opt/flink/lib/*"

USER flink