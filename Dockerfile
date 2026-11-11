FROM registry.access.redhat.com/ubi9/python-312-minimal:latest

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py rsa_toy.py shor_local.py watsonx_explainer.py ./
COPY static ./static
COPY templates ./templates

# משתמש לא-root (הקוד נטען לקריאה בלבד על ידי המשתמש הזה)
USER 1001

# Code Engine מגדיר PORT. השרת נשאר על 127.0.0.1, בלי 0.0.0.0
ENV PORT=8080
CMD ["sh", "-c", "exec gunicorn --bind 127.0.0.1:${PORT} --workers 1 --threads 4 --timeout 120 app:app"]
