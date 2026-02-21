FROM node:14-slim

WORKDIR /app

COPY ./custom-ckeditor5 custom-ckeditor5

RUN cd custom-ckeditor5 && npm install && npm run build && cd ..

ADD package.json package.json

RUN npm install -g express && npm install helmet && npm install --no-optional

COPY . ./

RUN npm run build

CMD ["node", "server.js"]