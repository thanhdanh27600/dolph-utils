# Get NPM packages
FROM node:14-alpine AS dependencies
WORKDIR /app
COPY package.json yarn.lock prisma prod.env ./
RUN npm install

# Rebuild the source code only when needed
FROM dependencies AS builder
WORKDIR /app
COPY . .
RUN npm run build
COPY ./prod.env ./.env
RUN npm run db:push

# Production image, copy all the files and run next
FROM builder AS runner
WORKDIR /app

ENV NODE_ENV production

# RUN addgroup -g 1003 -S nodejs
# RUN adduser -S nextjs -u 1003

# COPY --from=builder /app/.next ./.next
# COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/package.json ./package.json
# COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prod.db ./prisma
RUN chmod -R 777 ./prisma

# USER nextjs
EXPOSE 3000

CMD ["npm", "start"]
