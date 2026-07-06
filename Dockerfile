# Usando a imagem oficial do Apify com Node e Playwright pré-instalados
FROM apify/actor-node-playwright-chrome:20

# Copiar os arquivos de dependência
COPY --chown=myuser:myuser package*.json ./

# Instalar dependências de produção
RUN npm --quiet set progress=false \
 && npm install --omit=dev --omit=optional \
 && echo "Installed NPM packages:" \
 && (npm list --omit=dev --all || true) \
 && echo "Node.js version:" \
 && node --version \
 && echo "NPM version:" \
 && npm --version

# Copiar o restante do código fonte
COPY --chown=myuser:myuser . ./

# Executar o scraper
CMD npm start
