FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and pnpm-lock.yaml
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code into the Docker image
COPY . .

# Expose no port since there's no server

CMD ["npm", "run", "build"]