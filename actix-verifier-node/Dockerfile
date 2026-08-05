FROM rust:latest as builder
WORKDIR /usr/src/mesh-verifier

COPY Cargo.toml ./
RUN mkdir src && echo 'fn main() {println!("Mesh Cache Placeholder");}' > src/main.rs
RUN cargo build --release
RUN rm -f target/release/deps/mesh_verifier*

COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /usr/local/bin
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/src/mesh-verifier/target/release/mesh-verifier .
EXPOSE 8080
CMD ["./mesh-verifier"]
