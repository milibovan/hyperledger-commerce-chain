ARG AIRFLOW_IMAGE_TAG=3.1.6-python3.10
FROM apache/airflow:${AIRFLOW_IMAGE_TAG}

# Java configuration
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

RUN ln -s /usr/lib/jvm/$(ls /usr/lib/jvm/ | grep temurin) /usr/lib/jvm/default-java
ENV JAVA_HOME=/usr/lib/jvm/default-java
ENV PATH=$JAVA_HOME/bin:$PATH

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Switch to airflow user to install requirements
USER airflow
COPY docker-requirements.txt ./requirements.txt

# Use uv to install requirements
RUN uv pip install --no-cache -r requirements.txt