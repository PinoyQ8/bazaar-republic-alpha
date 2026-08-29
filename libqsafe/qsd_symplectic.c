#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define N_QUBITS 5
#define N_GENERATORS 4
#define VEC_LEN (2 * N_QUBITS)

// Compute the Symplectic Inner Product of two classical Pauli error vectors e1 and e2
// over F2^{2n}.
// Formula: <e1, e2>_sp = u1 * v2 + v1 * u2 = sum_{i=0}^{n-1} (e1[i] * e2[i+n] + e1[i+n] * e2[i]) mod 2
unsigned char symplectic_inner_product(const unsigned char *e1, const unsigned char *e2) {
    unsigned char product = 0;
    for (int i = 0; i < N_QUBITS; i++) {
        unsigned char u1 = e1[i];
        unsigned char v1 = e1[i + N_QUBITS];
        unsigned char u2 = e2[i];
        unsigned char v2 = e2[i + N_QUBITS];
        
        product ^= (u1 & v2) ^ (v1 & u2);
    }
    return product & 1;
}

// Compute standard matrix multiplication modulo 2: C = A * B (mod 2)
// A has dimensions (rA x cA), B has dimensions (cA x cB)
void matrix_mul_mod2(int rA, int cA, int cB, 
                     const unsigned char *A, 
                     const unsigned char *B, 
                     unsigned char *C) {
    for (int i = 0; i < rA; i++) {
        for (int j = 0; j < cB; j++) {
            unsigned char sum = 0;
            for (int k = 0; k < cA; k++) {
                sum ^= (A[i * cA + k] & B[k * cB + j]);
            }
            C[i * cB + j] = sum & 1;
        }
    }
}

// Print a vector of binary elements
void print_binary_vector(const char *label, const unsigned char *vec, int len) {
    printf("%s: [", label);
    for (int i = 0; i < len; i++) {
        printf("%d%s", vec[i], (i == len - 1) ? "" : " ");
    }
    printf("]\n");
}

// Print a matrix of binary elements
void print_binary_matrix(const char *label, const unsigned char *matrix, int rows, int cols) {
    printf("%s:\n", label);
    for (int i = 0; i < rows; i++) {
        printf("  [");
        for (int j = 0; j < cols; j++) {
            printf("%d%s", matrix[i * cols + j], (j == cols - 1) ? "" : " ");
        }
        printf("]\n");
    }
}

int main() {
    printf("=====================================================================\n");
    printf("         QUANTUM STABILIZER DECODING (QSD) SYMPLECTIC C ENGINE       \n");
    printf("=====================================================================\n\n");

    // 1. Classical Stabilizer Matrix H = (H_X | H_Z) for the 5-qubit perfect code
    // H_X is 4x5 representing bit flips, H_Z is 4x5 representing phase flips.
    // Full H is 4x10.
    unsigned char HX[N_GENERATORS * N_QUBITS] = {
        1, 0, 0, 1, 0,
        0, 1, 0, 0, 1,
        1, 0, 1, 0, 0,
        0, 1, 0, 1, 0
    };

    unsigned char HZ[N_GENERATORS * N_QUBITS] = {
        0, 1, 1, 0, 0,
        0, 0, 1, 1, 0,
        0, 0, 0, 1, 1,
        1, 0, 0, 0, 1
    };

    // Construct the full concatenated check matrix H = (H_X | H_Z)
    unsigned char H[N_GENERATORS * VEC_LEN];
    for (int i = 0; i < N_GENERATORS; i++) {
        // Copy H_X row
        memcpy(&H[i * VEC_LEN], &HX[i * N_QUBITS], N_QUBITS);
        // Copy H_Z row
        memcpy(&H[i * VEC_LEN + N_QUBITS], &HZ[i * N_QUBITS], N_QUBITS);
    }

    print_binary_matrix("H_X (Bit-flip parity matrix)", HX, N_GENERATORS, N_QUBITS);
    print_binary_matrix("H_Z (Phase-flip parity matrix)", HZ, N_GENERATORS, N_QUBITS);
    print_binary_matrix("Full Stabilizer Parity-Check Matrix H = (H_X | H_Z)", H, N_GENERATORS, VEC_LEN);
    printf("\n");

    // 2. Symplectic Self-Orthogonality Verification
    // Commutation check formula: H_X * H_Z^T + H_Z * H_X^T = 0 (mod 2)
    printf("--- 2. Commutativity Verification (Symplectic Orthogonality) ---\n");
    
    // Compute H_Z Transpose (5x4)
    unsigned char HZ_T[N_QUBITS * N_GENERATORS];
    for (int i = 0; i < N_GENERATORS; i++) {
        for (int j = 0; j < N_QUBITS; j++) {
            HZ_T[j * N_GENERATORS + i] = HZ[i * N_QUBITS + j];
        }
    }

    // Compute H_X Transpose (5x4)
    unsigned char HX_T[N_QUBITS * N_GENERATORS];
    for (int i = 0; i < N_GENERATORS; i++) {
        for (int j = 0; j < N_QUBITS; j++) {
            HX_T[j * N_GENERATORS + i] = HX[i * N_QUBITS + j];
        }
    }

    // Term 1: HX_HZ_T = H_X * H_Z^T (4x4)
    unsigned char HX_HZ_T[N_GENERATORS * N_GENERATORS];
    matrix_mul_mod2(N_GENERATORS, N_QUBITS, N_GENERATORS, HX, HZ_T, HX_HZ_T);

    // Term 2: HZ_HX_T = H_Z * H_X^T (4x4)
    unsigned char HZ_HX_T[N_GENERATORS * N_GENERATORS];
    matrix_mul_mod2(N_GENERATORS, N_QUBITS, N_GENERATORS, HZ, HX_T, HZ_HX_T);

    // Compute Sum = (H_X * H_Z^T + H_Z * H_X^T) mod 2
    unsigned char commutation_check[N_GENERATORS * N_GENERATORS];
    int self_orthogonal = 1;
    for (int i = 0; i < N_GENERATORS * N_GENERATORS; i++) {
        commutation_check[i] = (HX_HZ_T[i] ^ HZ_HX_T[i]) & 1;
        if (commutation_check[i] != 0) {
            self_orthogonal = 0;
        }
    }

    print_binary_matrix("Commutation Check Matrix (HX * HZ^T + HZ * HX^T mod 2)", commutation_check, N_GENERATORS, N_GENERATORS);
    printf("Self-Orthogonality Check: %s\n\n", self_orthogonal ? "PASSED (Generators commute perfectly)" : "FAILED");

    // 3. Simulated Pauli Error Injection
    // Let's inject a complex multi-qubit error vector e = (u_E | v_E)
    // u_E = [1 0 0 0 1] -> Bit flip (X) on Qubit 1, Qubit 5
    // v_E = [0 0 1 0 1] -> Phase flip (Z) on Qubit 3, Qubit 5
    // Resulting Error: X_1 * Z_3 * Y_5  (since Y = iXZ on Qubit 5)
    printf("--- 3. Simulated Pauli Error Vector ---\n");
    unsigned char u_E[N_QUBITS] = {1, 0, 0, 0, 1};
    unsigned char v_E[N_QUBITS] = {0, 0, 1, 0, 1};
    
    unsigned char e[VEC_LEN];
    memcpy(e, u_E, N_QUBITS);
    memcpy(&e[N_QUBITS], v_E, N_QUBITS);

    print_binary_vector("Bit-flip components (u_E)", u_E, N_QUBITS);
    print_binary_vector("Phase-flip components (v_E)", v_E, N_QUBITS);
    print_binary_vector("Full Error vector e = (u_E | v_E)", e, VEC_LEN);
    printf("Physical Error State: X on Qubit 1, Z on Qubit 3, Y on Qubit 5\n\n");

    // 4. Syndrome Calculation
    // We compute the syndrome bits s_i.
    // Each syndrome s_i is the symplectic inner product of generator row H_i and the error e.
    // Mathematically: s_i = <H_i, e>_sp
    printf("--- 4. Syndrome Extraction (Symplectic Vector Checks) ---\n");
    unsigned char syndrome[N_GENERATORS];
    for (int i = 0; i < N_GENERATORS; i++) {
        // Extract row i of H
        unsigned char H_row[VEC_LEN];
        memcpy(H_row, &H[i * VEC_LEN], VEC_LEN);
        
        // Compute symplectic inner product of H_row and error e
        syndrome[i] = symplectic_inner_product(H_row, e);
    }

    print_binary_vector("Extracted Error Syndrome s", syndrome, N_GENERATORS);

    // Verify via algebraic formula: s = H_X * v_E^T + H_Z * u_E^T (mod 2)
    unsigned char HX_v_E[N_GENERATORS];
    unsigned char HZ_u_E[N_GENERATORS];
    matrix_mul_mod2(N_GENERATORS, N_QUBITS, 1, HX, v_E, HX_v_E);
    matrix_mul_mod2(N_GENERATORS, N_QUBITS, 1, HZ, u_E, HZ_u_E);

    unsigned char syndrome_check[N_GENERATORS];
    int calculation_match = 1;
    for (int i = 0; i < N_GENERATORS; i++) {
        syndrome_check[i] = (HX_v_E[i] ^ HZ_u_E[i]) & 1;
        if (syndrome_check[i] != syndrome[i]) {
            calculation_match = 0;
        }
    }
    
    print_binary_vector("Algebraic Check (HX * v_E + HZ * u_E mod 2)", syndrome_check, N_GENERATORS);
    printf("Calculations Match: %s\n\n", calculation_match ? "YES (Algebraic & symplectic forms are isomorphic)" : "NO");

    // 5. The Variable Linkage Barrier (Cryptanalyst's Roadblock)
    printf("--- 5. The Variable Linkage Barrier (Uncertainty Principle) ---\n");
    printf("In classical LPN, variables are independent. In QSD, they are dual-paired (u_i, v_i).\n");
    printf("Look at the variables representing Qubit 5 (u_4 and v_4) across our generators:\n");
    printf("  Generator 1 (X Z Z X I) :  No dependencies on Qubit 5.\n");
    printf("  Generator 2 (I X Z Z X) :  Anticommutes (Syndrome = %d) -> Checks: v_2 + v_3 + u_4.\n", syndrome[1]);
    printf("  Generator 3 (X I X Z Z) :  Commutes     (Syndrome = %d) -> Checks: u_0 + u_2 + v_3 + v_4.\n", syndrome[2]);
    printf("  Generator 4 (Z X I X Z) :  Commutes     (Syndrome = %d) -> Checks: u_1 + u_3 + v_0 + v_4.\n", syndrome[3]);
    printf("\nNote how u_4 and v_4 are spread across and locked within the symplectic relations.\n");
    printf("To perform Gaussian elimination to isolate u_4, you must apply column operations.\n");
    printf("However, column operations MUST preserve the Symplectic Group Sp_2n(F2) structure:\n");
    printf("  M * Omega * M^T = Omega  (mod 2)\n");
    printf("If an attacker uses non-symplectic classical LPN reductions, they break self-orthogonality,\n");
    printf("causing noise coordinates to expand and permanently scrambling the private key.\n");
    printf("=====================================================================\n");

    return 0;
}
