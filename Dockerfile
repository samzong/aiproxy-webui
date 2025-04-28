FROM node:18-alpine AS build-stage

WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

COPY . .

# Build application
RUN yarn build

# Deployment stage
FROM nginx:stable-alpine AS production-stage

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build results from build stage to nginx service directory
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 
