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

ENV FLINK_VERSION=2.2.0
RUN wget https://archive.apache.org/dist/flink/flink-${FLINK_VERSION}/flink-${FLINK_VERSION}-bin-scala_2.12.tgz \
    && tar -xzf flink-${FLINK_VERSION}-bin-scala_2.12.tgz -C /opt/ \
    && ln -s /opt/flink-${FLINK_VERSION} /opt/flink \
    && rm flink-${FLINK_VERSION}-bin-scala_2.12.tgz

RUN ln -s /usr/lib/jvm/$(ls /usr/lib/jvm/ | grep temurin) /usr/lib/jvm/default-java
ENV JAVA_HOME=/usr/lib/jvm/default-java
ENV FLINK_HOME=/opt/flink
ENV PATH=$JAVA_HOME/bin:$FLINK_HOME/bin:$PATH

RUN mkdir -p /opt/flink/log && chmod -R 777 /opt/flink/log /opt/flink/lib

RUN wget -P /opt/flink/lib/ https://repo1.maven.org/maven2/org/apache/flink/flink-sql-parquet/2.2.0/flink-sql-parquet-2.2.0.jar

RUN wget -P /opt/flink/lib/ https://repo1.maven.org/maven2/org/apache/hadoop/hadoop-client-api/3.3.4/hadoop-client-api-3.3.4.jar && \
    wget -P /opt/flink/lib/ https://repo1.maven.org/maven2/org/apache/hadoop/hadoop-client-runtime/3.3.4/hadoop-client-runtime-3.3.4.jar

RUN wget -P /opt/flink/lib/ https://repo1.maven.org/maven2/com/fasterxml/woodstox/woodstox-core/6.5.1/woodstox-core-6.5.1.jar && \
    wget -P /opt/flink/lib/ https://repo1.maven.org/maven2/org/codehaus/woodstox/stax2-api/4.2.1/stax2-api-4.2.1.jar

RUN wget -P /opt/flink/lib/ https://repo1.maven.org/maven2/commons-logging/commons-logging/1.2/commons-logging-1.2.jar && \
    wget -P /opt/flink/lib/ https://repo1.maven.org/maven2/commons-configuration/commons-configuration/1.10/commons-configuration-1.10.jar

ENV HADOOP_CLASSPATH="/opt/flink/lib/hadoop-client-api-3.3.4.jar:/opt/flink/lib/hadoop-client-runtime-3.3.4.jar"
RUN echo "classloader.resolve-order: parent-first" >> /opt/flink/conf/flink-conf.yaml

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

USER airflow
COPY docker-requirements.txt ./requirements.txt

RUN uv pip install --no-cache -r requirements.txt