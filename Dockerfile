FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm rebuild bcrypt --build-from-source
RUN npx prisma generate
CMD ["npm", "run", "start"]
