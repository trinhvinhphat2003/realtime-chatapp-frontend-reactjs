FROM node:18-alpine
WORKDIR /app
COPY . . 
RUN yarn install --production && yarn build
CMD ["npm", "start"]