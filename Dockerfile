FROM node:18.17.1
WORKDIR /app
ENV PORT 3000
ENV MODEL_URL 'https://storage.googleapis.com/submission-asclepius-model/model/model.json'
COPY . .
RUN npm install
EXPOSE 3000
CMD ["node", "src/server/server.js"]
