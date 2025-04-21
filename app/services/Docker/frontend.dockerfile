# A node version that does not break the proj
FROM node:23.11.0-slim

# Set the working dir
WORKDIR /app

# Copying the necessary files and configurations
COPY /configs /app/configs
COPY /frontend /app/frontend

# Set the working directory to the frontend source directory
WORKDIR /app/frontend/spectrogram_viewer_gui/src

# Installing deps
RUN npm install

# Exposing the default port
EXPOSE 5173

# Starting dev server
CMD [ "npm", "run", "dev" ]