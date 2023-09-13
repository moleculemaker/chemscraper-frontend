# Builds a Docker image for the ChemScraper Frontend
#
# Usage:
#     docker build --secret id=.npmrc,src=$HOME/.npmrc -t moleculemaker/chemscraper-frontend .
#

# Use official node image as the base image
FROM --platform=$BUILDPLATFORM node:16 as build

# Set the working directory
WORKDIR /usr/local/app

# Pass in NPM credentials as a Docker build secret
ENV NPM_CONFIG_USERCONFIG="/run/secrets/.npmrc"
ENV DEBIAN_FRONTEND noninteractive

# Add dependencies manifest to app
COPY package.json package-lock.json ./

# Install all the dependencies
RUN --mount=type=secret,id=.npmrc npm install

# Add the source code to app
COPY . .

# Generate the build of the application
RUN npm run build


# Stage 2: Serve app with nginx server

# Use official nginx image as the base image
FROM nginx
#FROM hub.chemaxon.com/cxn-docker-release/chemaxon/mjs-webservice:latest

# Copy the build output to replace the default nginx contents
COPY --from=build /usr/local/app/dist/chemscraper /usr/share/nginx/html/
#COPY --from=build /usr/local/app/dist/chemscraper /app/mjs-webservice/static/

# Copy the nginx config file, which has a try_files rule for SPA routing
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Run our envloader script before starting NGINX
COPY entrypoint.sh /entrypoint.sh
CMD [ "/entrypoint.sh" ]

# Expose port 80
EXPOSE 80

