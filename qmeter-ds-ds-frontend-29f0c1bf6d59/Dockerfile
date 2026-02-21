FROM node:20-slim

WORKDIR /app

COPY ./custom-ckeditor5 custom-ckeditor5

RUN cd custom-ckeditor5 && npm install && npm run build && cd ..

COPY package.json package-lock.json* ./

RUN npm install

COPY . ./

RUN npm run build

CMD ["node", "server.js"]