# Menggunakan Node.js 18 sebagai base image
FROM node:18.17.1

# Set working directory di dalam container
WORKDIR /app

# Menentukan environment variables
ENV PORT=3000
ENV MODEL_URL="https://storage.googleapis.com/submission-asclepius-model/model/model.json"

# Menyalin semua file ke dalam container
COPY . .

# Menginstal dependencies
RUN npm install

# Mengekspos port 8080
EXPOSE 3000

# Menjalankan aplikasi menggunakan npm
CMD ["npm", "run", "start"]
