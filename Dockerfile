FROM node:latest

WORKDIR /app

COPY . .

# Create the Upload folder
RUN mkdir upload

CMD ["npm", "start"]
