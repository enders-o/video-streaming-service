FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy the application code
COPY auth-svc.py .

# Install Flask
RUN pip install Flask

# Expose the port that the app runs on
EXPOSE 8000

# Command to run the application
CMD ["python", "auth-svc.py"]
