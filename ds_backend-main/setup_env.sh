#!/bin/bash

set -e

install_python37() {
  if command -v apt-get >/dev/null; then
    echo "Attempting to install python3.7 using apt..."
    sudo apt-add-repository -y ppa:deadsnakes/ppa
    sudo apt-get update
    if sudo apt-get install -y python3.7 python3.7-venv python3.7-dev; then
      return 0
    fi
  fi

  if command -v pyenv >/dev/null; then
    echo "Attempting to install python3.7 using pyenv..."
    pyenv install -s 3.7.17 && pyenv global 3.7.17 && return 0
  fi

  return 1
}

# Install system packages mirroring Dockerfile
sudo apt-get update
sudo apt-get install -y \
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
  wkhtmltopdf \
  libssl-dev \
  software-properties-common

# Create Python 3.7 virtual environment
if ! command -v python3.7 >/dev/null; then
  echo "python3.7 not found. Attempting installation..."
  if install_python37; then
    echo "python3.7 installed successfully."
  else
    echo "Failed to install python3.7 automatically. Please install it manually and rerun this script." >&2
    exit 1
  fi
fi

python3.7 -m venv venv
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

# Source environment variables if .env exists
if [ -f .env ]; then
  set -o allexport
  source .env
  set +o allexport
else
  echo ".env file not found. Export environment variables manually." >&2
fi

cat <<EOM
Setup complete.
Activate the virtual environment with 'source venv/bin/activate'.
EOM
