#!/bin/bash
# PQC Working Group Engines Test Runner & Benchmarker
# Compiles, links, executes, and times both Phase 2 and Phase 3 implementations

# Color Output Configuration
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}=====================================================================${NC}"
echo -e "${CYAN}         POST-QUANTUM CRYPTOGRAPHY WORKING GROUP TEST RUNNER         ${NC}"
echo -e "${CYAN}=====================================================================${NC}"

# Check for required source files
MISSING_FILES=0
if [ ! -f vsf_engine_v2.c ]; then
    echo -e "${RED}[ERROR] vsf_engine_v2.c is missing from this directory!${NC}"
    MISSING_FILES=1
fi
if [ ! -f qsd_symplectic.c ]; then
    echo -e "${RED}[ERROR] qsd_symplectic.c is missing from this directory!${NC}"
    MISSING_FILES=1
fi
if [ ! -f Makefile ]; then
    echo -e "${RED}[ERROR] Makefile is missing from this directory!${NC}"
    MISSING_FILES=1
fi

if [ $MISSING_FILES -eq 1 ]; then
    echo -e "${YELLOW}Please ensure vsf_engine_v2.c, qsd_symplectic.c, and the Makefile${NC}"
    echo -e "${YELLOW}are all placed in the current working directory before running this script.${NC}"
    exit 1
fi

# Step 1: Compilation via Makefile
echo -e "\n${YELLOW}[STAGE 1: COMPILATION]${NC}"
echo -e "Compiling C-code engines via Makefile..."
make clean
make all

if [ $? -ne 0 ]; then
    echo -e "${RED}[FATAL] Compilation failed! Please verify that 'gcc' and 'make' are installed.${NC}"
    exit 1
fi
echo -e "${GREEN}[SUCCESS] Binaries compiled successfully!${NC}"

# Step 2: Running Phase 2 VSF Engine with Timing
echo -e "\n${YELLOW}[STAGE 2: EXECUTING PHASE 2 VSF ENGINE]${NC}"
echo -e "${CYAN}---------------------------------------------------------------------${NC}"
if [ -f ./vsf_engine ]; then
    START_TIME=$(date +%s.%N)
    ./vsf_engine
    END_TIME=$(date +%s.%N)
    
    # Calculate execution duration
    DURATION=$(echo "$END_TIME - $START_TIME" | bc -l 2>/dev/null)
    if [ $? -eq 0 ] && [ ! -z "$DURATION" ]; then
        echo -e "${CYAN}---------------------------------------------------------------------${NC}"
        echo -e "${GREEN}[BENCHMARK] Phase 2 VSF Execution completed in: ${DURATION} seconds${NC}"
    else
        echo -e "${CYAN}---------------------------------------------------------------------${NC}"
        echo -e "${GREEN}[BENCHMARK] Phase 2 VSF Execution completed successfully.${NC}"
    fi
else
    echo -e "${RED}[ERROR] ./vsf_engine binary not found!${NC}"
    exit 1
fi

# Step 3: Running Phase 3 QSD Engine with Timing
echo -e "\n${YELLOW}[STAGE 3: EXECUTING PHASE 3 QSD ENGINE]${NC}"
echo -e "${CYAN}---------------------------------------------------------------------${NC}"
if [ -f ./qsd_symplectic ]; then
    START_TIME=$(date +%s.%N)
    ./qsd_symplectic
    END_TIME=$(date +%s.%N)
    
    # Calculate execution duration
    DURATION=$(echo "$END_TIME - $START_TIME" | bc -l 2>/dev/null)
    if [ $? -eq 0 ] && [ ! -z "$DURATION" ]; then
        echo -e "${CYAN}---------------------------------------------------------------------${NC}"
        echo -e "${GREEN}[BENCHMARK] Phase 3 QSD Execution completed in: ${DURATION} seconds${NC}"
    else
        echo -e "${CYAN}---------------------------------------------------------------------${NC}"
        echo -e "${GREEN}[BENCHMARK] Phase 3 QSD Execution completed successfully.${NC}"
    fi
else
    echo -e "${RED}[ERROR] ./qsd_symplectic binary not found!${NC}"
    exit 1
fi

echo -e "\n${CYAN}=====================================================================${NC}"
echo -e "${GREEN}         ALL ROADMAP ENGINES EXECUTED AND BENCHMARKED SUCCESSFULLY   ${NC}"
echo -e "${CYAN}=====================================================================${NC}"
