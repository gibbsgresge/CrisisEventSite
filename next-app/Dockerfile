FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json into the container
COPY package*.json /app/

# Install dependencies
RUN npm install

# Copy the rest of the Next.js code into the container
COPY . /app/

# Expose port 3000 for the Next.js app
EXPOSE 3000

# Build and start the Next.js app
CMD ["npm", "run", "dev"]
