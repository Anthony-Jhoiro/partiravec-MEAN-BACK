FROM node:latest

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY node_modules node_modules
COPY dist dist

# Create the Upload folder
RUN mkdir -p upload

CMD ["npm", "start"]
