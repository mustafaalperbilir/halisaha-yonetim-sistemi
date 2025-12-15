# Dosya: backend/Dockerfile

# 1. Node.js'in hafif sürümünü kullan
FROM node:18-alpine

# 2. Klasör oluştur
WORKDIR /app

# 3. Paket listelerini kopyala ve yükle
COPY package*.json ./
RUN npm install

# 4. Tüm kodları içeri al
COPY . .

# 5. Portu belirt
EXPOSE 5000

# 6. Başlat
CMD ["node", "index.js"]