FROM registry.access.redhat.com/ubi9/python-312-minimal:latest

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py rsa_toy.py shor_local.py watsonx_explainer.py ./
COPY static ./static
COPY templates ./templates

# משתמש לא-root
USER 1001

# Code Engine מגדיר PORT. השרת קשור לכתובות מפורשות בלבד: loopback וכתובת ה-IP של הקונטיינר.
# אין קשירה ל-0.0.0.0 (כל הממשקים).
ENV PORT=8080
CMD ["sh", "-c", "exec gunicorn --bind 127.0.0.1:${PORT} --bind $(python -c 'import socket;print(socket.gethostbyname(socket.gethostname()))'):${PORT} --workers 1 --threads 4 --timeout 120 app:app"]
