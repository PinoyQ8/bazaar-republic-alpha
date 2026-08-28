FROM node:22-alpine AS builder
WORKDIR /app
ENV HUSKY=0
ENV DATABASE_URL="mongodb://127.0.0.1:27017/bazaar_republic?directConnection=true"
ENV MONGODB_URI="mongodb://127.0.0.1:27017/bazaar_republic?directConnection=true"

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --include=dev --ignore-scripts
RUN npx prisma generate

COPY . .
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
