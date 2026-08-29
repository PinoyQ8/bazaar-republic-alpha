# Makefile for Post-Quantum Cryptography WG Engines
# Compiles Phase 2 (VSF) and Phase 3 (QSD) engines

CC = gcc
CFLAGS = -O3 -Wall -Wextra -std=c11 -I include
SRC_DIR = src
TARGETS = vsf_engine qsd_symplectic

all: $(TARGETS)

vsf_engine: $(SRC_DIR)/vsf_engine_v2.c
	@echo "Compiling Phase 2: Vector Space Factorization (VSF) Engine..."
	$(CC) $(CFLAGS) $(SRC_DIR)/vsf_engine_v2.c -o vsf_engine

qsd_symplectic: $(SRC_DIR)/qsd_symplectic.c
	@echo "Compiling Phase 3: Quantum Stabilizer Decoding (QSD) Engine..."
	$(CC) $(CFLAGS) $(SRC_DIR)/qsd_symplectic.c -o qsd_symplectic

clean:
	@echo "Cleaning up generated binaries..."
	rm -f vsf_engine vsf_engine.exe qsd_symplectic qsd_symplectic.exe

.PHONY: all clean
