# Dosya: frontend/Dockerfile

# --- AŞAMA 1: İNŞA ET (BUILD) ---
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- AŞAMA 2: YAYINLA (NGINX) ---
FROM nginx:alpine
# React çıktılarını Nginx'e kopyala
COPY --from=build /app/dist /usr/share/nginx/html
# Ayar dosyasını kopyala
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]