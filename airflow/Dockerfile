ARG AIRFLOW_IMAGE_TAG=3.1.6-python3.10
FROM apache/airflow:${AIRFLOW_IMAGE_TAG}

ARG JAVA_VERSION=17
USER root

RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    gcc \
    libkrb5-dev \
    && wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public | gpg --dearmor -o /usr/share/keyrings/adoptium.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb bookworm main" | tee /etc/apt/sources.list.d/adoptium.list \
    && apt-get update && apt install -y temurin-${JAVA_VERSION}-jdk --no-install-recommends \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

ENV FLINK_VERSION=1.20.0
RUN wget https://archive.apache.org/dist/flink/flink-${FLINK_VERSION}/flink-${FLINK_VERSION}-bin-scala_2.12.tgz \
    && tar -xzf flink-${FLINK_VERSION}-bin-scala_2.12.tgz -C /opt/ \
    && ln -s /opt/flink-${FLINK_VERSION} /opt/flink \
    && rm flink-${FLINK_VERSION}-bin-scala_2.12.tgz

RUN ln -s /usr/lib/jvm/$(ls /usr/lib/jvm/ | grep temurin) /usr/lib/jvm/default-java
ENV JAVA_HOME=/usr/lib/jvm/default-java

# Install Confluent CLI
# RUN curl -sL --http1.1 https://cnfl.io/cli | sh -s -- -b /usr/local/bin

# # You no longer need the local Flink TGZ or FLINK_HOME
# # But keep JAVA as it's required for some CLI operations
# ENV PATH="/usr/local/bin:${PATH}"

ENV FLINK_HOME=/opt/flink
ENV PATH=$JAVA_HOME/bin:$FLINK_HOME/bin:$PATH

RUN mkdir -p /opt/flink/log && chmod -R 777 /opt/flink/log /opt/flink/lib

RUN wget -P /opt/flink/lib/ https://repo1.maven.org/maven2/org/apache/flink/flink-sql-parquet/1.20.0/flink-sql-parquet-1.20.0.jar

RUN wget -P /opt/flink/lib/ https://repo1.maven.org/maven2/org/apache/hadoop/hadoop-client-api/3.3.4/hadoop-client-api-3.3.4.jar && \
    wget -P /opt/flink/lib/ https://repo1.maven.org/maven2/org/apache/hadoop/hadoop-client-runtime/3.3.4/hadoop-client-runtime-3.3.4.jar

RUN wget -P /opt/flink/lib/ https://repo1.maven.org/maven2/com/fasterxml/woodstox/woodstox-core/6.5.1/woodstox-core-6.5.1.jar && \
    wget -P /opt/flink/lib/ https://repo1.maven.org/maven2/org/codehaus/woodstox/stax2-api/4.2.1/stax2-api-4.2.1.jar

RUN wget -P /opt/flink/lib/ https://repo1.maven.org/maven2/commons-logging/commons-logging/1.2/commons-logging-1.2.jar && \
    wget -P /opt/flink/lib/ https://repo1.maven.org/maven2/commons-configuration/commons-configuration/1.10/commons-configuration-1.10.jar

RUN mkdir -p /opt/flink/lib && \
    wget -P /opt/flink/lib/ https://repo.maven.apache.org/maven2/org/apache/flink/flink-connector-jdbc/3.3.0-1.20/flink-connector-jdbc-3.3.0-1.20.jar && \
    wget -P /opt/flink/lib/ https://repo.maven.apache.org/maven2/org/apache/flink/flink-connector-jdbc-postgres/3.3.0-1.20/flink-connector-jdbc-postgres-3.3.0-1.20.jar && \
    wget -P /opt/flink/lib/ https://jdbc.postgresql.org/download/postgresql-42.7.9.jar && \
    wget -P /opt/flink/lib/ https://repo1.maven.org/maven2/org/apache/flink/flink-sql-parquet/1.20.0/flink-sql-parquet-1.20.0.jar

RUN chmod -R 755 /opt/flink/lib

ENV HADOOP_CLASSPATH="/opt/flink/lib/hadoop-client-api-3.3.4.jar:/opt/flink/lib/hadoop-client-runtime-3.3.4.jar"

# Configure Flink with JVM options for Java 17
RUN echo "classloader.resolve-order: parent-first" >> /opt/flink/conf/flink-conf.yaml && \
    echo "env.java.opts.all: --add-opens java.base/java.util=ALL-UNNAMED --add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.net=ALL-UNNAMED --add-opens java.base/java.io=ALL-UNNAMED --add-opens java.base/java.lang.invoke=ALL-UNNAMED" >> /opt/flink/conf/flink-conf.yaml && \
    echo "env.java.opts: --add-opens java.base/java.util=ALL-UNNAMED --add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.net=ALL-UNNAMED --add-opens java.base/java.io=ALL-UNNAMED --add-opens java.base/java.lang.invoke=ALL-UNNAMED" >> /opt/flink/conf/flink-conf.yaml && \
    echo "env.java.opts.client: --add-opens java.base/java.util=ALL-UNNAMED --add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.net=ALL-UNNAMED --add-opens java.base/java.io=ALL-UNNAMED --add-opens java.base/java.lang.invoke=ALL-UNNAMED" >> /opt/flink/conf/flink-conf.yaml

# Set Flink-specific environment variable (safer than JAVA_TOOL_OPTIONS)
ENV FLINK_ENV_JAVA_OPTS="--add-opens java.base/java.util=ALL-UNNAMED --add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.net=ALL-UNNAMED --add-opens java.base/java.io=ALL-UNNAMED --add-opens java.base/java.lang.invoke=ALL-UNNAMED"

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

USER airflow
COPY docker-requirements.txt ./requirements.txt

RUN uv pip install --no-cache -r requirements.txt