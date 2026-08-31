FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG VITE_SERVER_URL
ARG VITE_PRIVY_APP_ID

ENV VITE_SERVER_URL=$VITE_SERVER_URL
ENV VITE_PRIVY_APP_ID=$VITE_PRIVY_APP_ID

RUN npm run build


FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]