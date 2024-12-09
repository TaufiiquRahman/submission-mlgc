FROM node:18.17.1
WORKDIR /app
ENV PORT 4000
ENV MODEL_URL 'https://storage.googleapis.com/asclepius-mlmodel/mlmodel/model.json'
COPY . .
RUN npm install
EXPOSE 4000
CMD [ "npm", "run", "start"]