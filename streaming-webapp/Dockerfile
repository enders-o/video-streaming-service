FROM node:22
WORKDIR /usr/src/app
COPY package*.json app.js index.html ./
RUN npm install
EXPOSE 3100
CMD ["node", "app.js"]
