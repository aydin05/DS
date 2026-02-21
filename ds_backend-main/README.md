# DS Backend

This project contains the backend codebase. To quickly set up a local development environment without Docker, you can use the `setup_env.sh` helper script.

## Local environment setup

1. Ensure you have **Python 3.7** installed on your machine. A couple of common
   approaches are shown below:

   * Using `apt` with the deadsnakes PPA:

     ```bash
     sudo apt-add-repository ppa:deadsnakes/ppa
     sudo apt-get update
     sudo apt-get install python3.7 python3.7-venv python3.7-dev
     ```

   * Using `pyenv` when apt packages are unavailable:

     ```bash
     pyenv install 3.7.17
     pyenv local 3.7.17
     ```
2. Run the setup script from the project root:

```bash
./setup_env.sh
```

The script installs required apt packages, creates a Python 3.7 virtual environment under `venv/` and installs Python dependencies from `requirements.txt`.

If a `.env` file exists in the project root, its variables are automatically exported. Otherwise, export the required environment variables manually before running the application.

Activate the virtual environment using:

```bash
source venv/bin/activate
```

Once activated, you can run Django management commands as usual.
