FROM node:latest

WORKDIR /app

COPY . .

# Create the Upload folder
RUN mkdir -p upload

CMD ["npm", "start"]
