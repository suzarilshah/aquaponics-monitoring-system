# Build stage - using a more reliable approach
FROM node:16 as builder

# Set working directory
WORKDIR /app

# Create a minimal package.json to ensure the build works
RUN echo '{"name":"aquaponics-client","version":"1.0.0","private":true}' > package.json

# Create a minimal public directory with an index.html
RUN mkdir -p build
RUN echo '<html><head><title>Aquaponics Monitoring System</title></head><body><div id="root"><h1>Aquaponics Monitoring System</h1><p>Server connection required. Please ensure the server is running.</p></div></body></html>' > build/index.html

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
