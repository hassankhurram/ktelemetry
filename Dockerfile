FROM devhsol/oc-baseimages:nodejs-backend

# Set Puppeteer environment variables
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Set working directory
WORKDIR /usr/src/app

# Copy application files
COPY package*.json ./
RUN npm install --omit=dev
COPY . .

# Expose the port (Cloud Run uses $PORT)
ENV PORT=8080
EXPOSE 8080
RUN npm i -g nodemon
# Run the application
CMD ["npm", "run", "start"]
