# Use official node image as the base image
FROM --platform=$BUILDPLATFORM node:16 as build

# Set the working directory
WORKDIR /usr/local/app

# Add the source code to app
COPY ./ /usr/local/app/

# Install all the dependencies
RUN npm install

# Generate the build of the application
ARG configuration=production
RUN npm run build --configuration=$configuration


# Stage 2: Serve app with nginx server

# Use official nginx image as the base image
FROM nginx:1.23.3

# Copy the build output to replace the default nginx contents
COPY --from=build /usr/local/app/dist/clean /usr/share/nginx/html

# Copy the nginx config file, which has a try_files rule for SPA routing
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

