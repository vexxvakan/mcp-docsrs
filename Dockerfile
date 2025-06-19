# Multi-stage build for smaller final image
FROM alpine:latest AS runtime

# Install required runtime dependencies
# libstdc++ and libgcc are needed because Bun's MUSL builds aren't fully static
RUN apk add --no-cache libstdc++ libgcc

# Create non-root user for security
RUN addgroup -g 1000 mcp && \
    adduser -u 1000 -G mcp -s /bin/sh -D mcp

# Copy the appropriate binary based on target architecture
# We'll handle the architecture mapping in the build process
ARG BINARY_NAME
COPY dist/${BINARY_NAME} /usr/local/bin/mcp-docsrs

# Make binary executable
RUN chmod +x /usr/local/bin/mcp-docsrs

# Switch to non-root user
USER mcp

# MCP servers typically communicate via stdio
ENTRYPOINT ["mcp-docsrs"]