FROM node:9

COPY ./ /app
WORKDIR /app

RUN npm install --production

CMD ["npm", "start"]