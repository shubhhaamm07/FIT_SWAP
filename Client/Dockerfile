FROM node:22-alpine AS builder
WORKDIR /app
# here we are wrtng * beacuse we want to copy both package.json and package-lock.json files and ./ beacause we want to copy them to the current working directory which is /app
COPY package*.json ./ 
RUN npm ci
COPY . . 
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build
#............here the completion of the building is complete.............
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder  /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
