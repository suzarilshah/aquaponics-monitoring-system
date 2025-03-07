# Build stage
FROM node:16 as builder

# Set working directory
WORKDIR /app

# Copy everything at once to ensure package.json is included
COPY . .

# Install dependencies
RUN npm install

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
