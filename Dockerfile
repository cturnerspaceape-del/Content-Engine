FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --include=dev
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npx", "tsx", "server/index.ts"]
