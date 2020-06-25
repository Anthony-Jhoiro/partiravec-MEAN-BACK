FROM node:latest

WORKDIR /app

COPY . .

# intall depencies and build the angular frontend
RUN npm install

# Create the Upload folder
RUN mkdir upload

CMD ["npm", "start"]
