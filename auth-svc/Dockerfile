FROM python:3.9-slim
WORKDIR /app

COPY auth-svc.py .
COPY templates templates
RUN pip install Flask python-dotenv

EXPOSE 8000
CMD ["python", "auth-svc.py"]
