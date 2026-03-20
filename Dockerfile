FROM oven/bun:1.3.11-alpine AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY src ./src
COPY tsconfig.json ./

ARG TARGETARCH
RUN case "$TARGETARCH" in \
    amd64) TARGET="bun-linux-x64-musl" ;; \
    arm64) TARGET="bun-linux-arm64-musl" ;; \
    *) echo "Unsupported target arch: $TARGETARCH" && exit 1 ;; \
  esac && \
  bun build ./src/cli.ts --compile --minify --bytecode --target="$TARGET" --outfile /out/mcp-docsrs

FROM alpine:latest AS runtime

RUN apk add --no-cache libstdc++ libgcc

RUN addgroup -g 1000 mcp && \
    adduser -u 1000 -G mcp -s /bin/sh -D mcp

COPY --from=build /out/mcp-docsrs /usr/local/bin/mcp-docsrs
RUN chmod +x /usr/local/bin/mcp-docsrs

USER mcp

ENTRYPOINT ["mcp-docsrs"]
