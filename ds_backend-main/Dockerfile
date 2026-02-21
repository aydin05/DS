FROM python:3.12-slim

ENV PYTHONUNBUFFERED 1
ENV APP_ROOT /code
ENV DEBUG False

RUN apt-get update && apt-get install -y \
  locales \
  locales-all \
  build-essential \
  libpq-dev \
  libjpeg-dev \
  binutils \
  libproj-dev \
  gdal-bin \
  libxml2-dev \
  libxslt1-dev \
  zlib1g-dev \
  libffi-dev \
  libssl-dev \
  ffmpeg \
  supervisor

COPY mime.types /etc/mime.types

RUN mkdir ${APP_ROOT}
COPY . ${APP_ROOT}
WORKDIR ${APP_ROOT}

#RUN pip install --upgrade pip
RUN pip install -r requirements.txt