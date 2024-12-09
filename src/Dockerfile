# Gunakan image Node.js sebagai base image
FROM node:18

# Set direktori kerja di dalam container
WORKDIR /usr/src/app

# Menyalin package.json dan package-lock.json untuk memanfaatkan cache
COPY package*.json ./

# Install dependensi (akan dicache selama tidak ada perubahan pada package.json)
RUN npm install

# Menyalin semua file ke dalam container setelah dependensi diinstal
COPY . .

# Build model atau langkah lainnya jika perlu (contoh)
# RUN npm run build (jika ada build step)

# Mengekspos port yang digunakan oleh aplikasi
EXPOSE 8080

# Menjalankan aplikasi
CMD ["node", "server.js"]
