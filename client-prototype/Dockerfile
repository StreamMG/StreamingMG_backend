FROM node:20-alpine AS build

# Build the Vite React App
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# 🚀 FIX RENDER: Vite "cuisson" les variables au build time.
# Il faut déclarer les ARGs pour que Docker puisse les récupérer.
ARG VITE_API_URL
ARG VITE_BASE_URL
ARG VITE_STRIPE_PUBLIC_KEY

# Convertir les ARGs en variables d'environnement (ENV) pour le process Vite
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BASE_URL=$VITE_BASE_URL
ENV VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY

RUN npm run build

# Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Configure Nginx for Single Page Application (React Router)
RUN echo -e "server {\n    listen 80;\n    location / {\n        root /usr/share/nginx/html;\n        index index.html;\n        try_files \$uri \$uri/ /index.html;\n    }\n}" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
