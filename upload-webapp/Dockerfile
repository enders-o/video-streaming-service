FROM node:22
WORKDIR /usr/src/app
RUN mkdir temp
COPY package*.json app.js ./
RUN npm install
EXPOSE 3000
CMD ["node", "app.js"]
