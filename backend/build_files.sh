#!/bin/bash

echo "===> Instalando dependencias..."
pip install -r requirements.txt

echo "===> Recolectando archivos estáticos..."
python3.12 manage.py collectstatic --noinput

echo "===> Ejecutando migraciones..."
python3.12 manage.py migrate --noinput

echo "===> Build finalizado con éxito."
