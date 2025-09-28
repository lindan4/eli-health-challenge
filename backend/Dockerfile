# backend/Dockerfile

FROM node:20

WORKDIR /usr/src/app

# Copy root lockfile + backend package.json
COPY package.json yarn.lock ./
COPY backend/package.json ./backend/

# Install all dependencies
RUN yarn install --frozen-lockfile

# Copy backend source code
COPY backend/ ./backend/

WORKDIR /usr/src/app/backend

# Expose port your backend uses
EXPOSE 5000

# Run dev script
CMD ["yarn", "dev"]