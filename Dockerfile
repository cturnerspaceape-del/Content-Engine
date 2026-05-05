FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --include=dev
COPY . .

# Optional: pull the reference-image pool from R2 (or any public URL) at
# build time. Tarball must contain `references/brand/<file>` paths so it
# extracts directly into public/. If REFS_TARBALL_URL is unset the build
# proceeds with whatever's already in public/references/ (usually empty in
# git — only .gitkeep is tracked) — generation still works using the
# product ref + research-fetched URLs, just without the static brand pool.
ARG REFS_TARBALL_URL
RUN if [ -n "$REFS_TARBALL_URL" ]; then \
      apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && \
      curl -fsSL "$REFS_TARBALL_URL" -o /tmp/refs.tar.gz && \
      tar -xzf /tmp/refs.tar.gz -C public && \
      rm /tmp/refs.tar.gz && \
      apt-get purge -y curl && apt-get autoremove -y && rm -rf /var/lib/apt/lists/* && \
      echo "[refs] pulled $(ls public/references/brand | wc -l) files from R2"; \
    else \
      echo "[refs] REFS_TARBALL_URL not set — skipping static-ref pull"; \
    fi

RUN npm run build
EXPOSE 3000
CMD ["npx", "tsx", "server/index.ts"]
