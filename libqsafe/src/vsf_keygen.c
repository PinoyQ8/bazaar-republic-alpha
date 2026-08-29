#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Field size parameters for the toy GF(2^5) VSF scheme
#define M 5
#define R 2
#define N 2
#define IRREDUCIBLE_POLY 37 // x^5 + x^2 + 1 (100101_2)

// GF(2^5) Multiplication modulo x^5 + x^2 + 1
unsigned char gf_mul(unsigned char a, unsigned char b) {
    unsigned int res = 0;
    for (int i = 0; i < M; i++) {
        if ((b >> i) & 1) {
            res ^= (a << i);
        }
    }
    // Reduce modulo the irreducible polynomial (degree 5)
    for (int i = 8; i >= M; i--) {
        if ((res >> i) & 1) {
            res ^= (IRREDUCIBLE_POLY << (i - M));
        }
    }
    return (unsigned char)(res & 0x1F);
}

// Convert an integer field element in GF(2^5) to a binary vector of length 5
void val_to_vector(unsigned char val, unsigned char *vec) {
    for (int i = 0; i < M; i++) {
        vec[i] = (val >> (M - 1 - i)) & 1;
    }
}

// Convert a binary vector of length 5 to an integer field element
unsigned char vector_to_val(const unsigned char *vec) {
    unsigned char val = 0;
    for (int i = 0; i < M; i++) {
        val |= (vec[i] << (M - 1 - i));
    }
    return val;
}

// Perform Gaussian elimination over GF(2) to put a matrix in Row Echelon Form (REF)
// Returns the rank of the matrix.
int row_echelon_form(unsigned char matrix[R * N][M], int rows, int cols) {
    int lead = 0;
    for (int r = 0; r < rows; r++) {
        if (lead >= cols) {
            return r;
        }
        int i = r;
        while (matrix[i][lead] == 0) {
            i++;
            if (i == rows) {
                i = r;
                lead++;
                if (lead == cols) {
                    return r;
                }
            }
        }
        // Swap rows i and r
        if (i != r) {
            for (int c = 0; c < cols; c++) {
                unsigned char temp = matrix[i][c];
                matrix[i][c] = matrix[r][c];
                matrix[r][c] = temp;
            }
        }
        // Eliminate down and up to obtain Reduced Row Echelon Form (RREF)
        for (int j = 0; j < rows; j++) {
            if (j != r && matrix[j][lead] == 1) {
                for (int c = 0; c < cols; c++) {
                    matrix[j][c] ^= matrix[r][c];
                }
            }
        }
        lead++;
    }
    // Count active non-zero rows
    int rank = 0;
    for (int r = 0; r < rows; r++) {
        int non_zero = 0;
        for (int c = 0; c < cols; c++) {
            if (matrix[r][c] != 0) {
                non_zero = 1;
                break;
            }
        }
        if (non_zero) {
            rank++;
        }
    }
    return rank;
}

int main() {
    printf("=============================================================\n");
    printf("         PHASE 2 VSF KEY GENERATION ENGINE (C PORT)          \n");
    printf("=============================================================\n\n");

    // Secret Systematic Bases for U and V (as simulated in the Python engine)
    // U = Span(u_0, u_1), V = Span(v_0, v_1)
    // In systematic form:
    // u_0 = 21 -> [1, 0, 1, 0, 1]
    // u_1 = 26 -> [0, 1, 0, 1, 1]
    // v_0 = 13 -> [1, 0, 1, 1, 0]
    // v_1 = 18 -> [0, 1, 0, 0, 1]
    unsigned char U[R] = {21, 26};
    unsigned char V[N] = {13, 18};

    printf("--- 1. Private Key (Secret Subspaces) ---\n");
    printf("Subspace U (dimension %d):\n", R);
    for (int i = 0; i < R; i++) {
        unsigned char vec[M];
        val_to_vector(U[i], vec);
        printf("  u_%d = %2d (binary: [", i, U[i]);
        for (int j = 0; j < M; j++) printf("%d%s", vec[j], j == M - 1 ? "" : " ");
        printf("])\n");
    }

    printf("\nSubspace V (dimension %d):\n", N);
    for (int i = 0; i < N; i++) {
        unsigned char vec[M];
        val_to_vector(V[i], vec);
        printf("  v_%d = %2d (binary: [", i, V[i]);
        for (int j = 0; j < M; j++) printf("%d%s", vec[j], j == M - 1 ? "" : " ");
        printf("])\n");
    }

    // Compute pairwise bilinear products w_ij = u_i * v_j in GF(2^5)
    unsigned char W_elements[R * N];
    printf("\n--- 2. Pairwise Products (W_raw) ---\n");
    for (int i = 0; i < R; i++) {
        for (int j = 0; j < N; j++) {
            W_elements[i * N + j] = gf_mul(U[i], V[j]);
            printf("  u_%d * v_%d = %2d * %2d = %2d\n", i, j, U[i], V[j], W_elements[i * N + j]);
        }
    }

    // Convert products to binary coordinate vectors to form the raw matrix
    unsigned char W_matrix[R * N][M];
    for (int i = 0; i < R * N; i++) {
        val_to_vector(W_elements[i], W_matrix[i]);
    }

    printf("\n--- 3. Raw Product Space Matrix (W_raw in binary) ---\n");
    for (int i = 0; i < R * N; i++) {
        printf("  [");
        for (int j = 0; j < M; j++) printf("%d%s", W_matrix[i][j], j == M - 1 ? "" : " ");
        printf("]\n");
    }

    // Compute Reduced Row Echelon Form (RREF) to yield the unique canonical Public Key basis
    int rank = row_echelon_form(W_matrix, R * N, M);

    printf("\n--- 4. Public Key Canonical Basis (Reduced Row Echelon Form) ---\n");
    for (int i = 0; i < rank; i++) {
        printf("  e_%d = [", i);
        for (int j = 0; j < M; j++) printf("%d%s", W_matrix[i][j], j == M - 1 ? "" : " ");
        printf("] -> Value: %d\n", vector_to_val(W_matrix[i]));
    }
    printf("\nCanonical Product Space W Dimension (Rank): %d\n", rank);
    printf("=============================================================\n");

    return 0;
}
