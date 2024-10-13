FROM node:14

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json auth-service.js ./
RUN npm install

# Copy the template and shell script to the container
COPY nginx.conf /etc/nginx/nginx.conf
COPY start-nginx.sh /start-nginx.sh
COPY .env /etc/nginx/.env

# Make sure the script is executable
RUN chmod +x /start-nginx.sh

# Expose port 8080 for the authentication service
EXPOSE 8080

# Start the authentication service
CMD ["/start-nginx.sh"]
CMD ["node", "auth-service.js"]
