# Get NPM packages
FROM node:14-alpine AS dependencies
WORKDIR /app
COPY package.json yarn.lock prisma prod.env ./
RUN npm install

# Rebuild the source code only when needed
FROM node:14-alpine AS builder
WORKDIR /app
COPY . .
RUN npm run build

# Production image, copy all the files and run next
FROM node:14-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prod.env ./.env
COPY --from=builder /app/prisma ./prisma
RUN npm run db:push
RUN chmod -R 777 prisma

USER nextjs
EXPOSE 3000

CMD ["npm", "start"]