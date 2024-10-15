FROM node:22
WORKDIR /usr/src/app
COPY package*.json app.js ./
RUN npm install
EXPOSE 4000
CMD ["node", "app.js"]
