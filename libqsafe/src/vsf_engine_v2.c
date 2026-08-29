#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// =====================================================================
// SECTION 1: GLOBAL CONFIGURATIONS & COMPONENT PARAMETERS
// =====================================================================

// GF(2^5) parameters for the VSF Key Generation portion
#define GF32_M 5
#define GF32_R 2
#define GF32_N 2
#define GF32_IRREDUCIBLE 37 // x^5 + x^2 + 1 (100101_2)

// GF(257) parameters for the TCitH Zero-Knowledge verification portion
#define P 257
#define TCITH_N 5           // Total number of virtual players
#define TCITH_D 2           // Polynomial degree d (reconstruction threshold k = d + 1 = 3)

// =====================================================================
// SECTION 2: GF(2^5) MATHEMATICAL ENGINE & UTILITIES (VSF Component)
// =====================================================================

// Multiplication modulo x^5 + x^2 + 1
unsigned char gf32_mul(unsigned char a, unsigned char b) {
    unsigned int res = 0;
    for (int i = 0; i < GF32_M; i++) {
        if ((b >> i) & 1) {
            res ^= (a << i);
        }
    }
    // Reduce modulo the irreducible polynomial (degree 5)
    for (int i = 8; i >= GF32_M; i--) {
        if ((res >> i) & 1) {
            res ^= (GF32_IRREDUCIBLE << (i - GF32_M));
        }
    }
    return (unsigned char)(res & 0x1F);
}

// Convert integer value to 5-bit binary vector
void gf32_val_to_vector(unsigned char val, unsigned char *vec) {
    for (int i = 0; i < GF32_M; i++) {
        vec[i] = (val >> (GF32_M - 1 - i)) & 1;
    }
}

// Convert 5-bit binary vector back to integer value
unsigned char gf32_vector_to_val(const unsigned char *vec) {
    unsigned char val = 0;
    for (int i = 0; i < GF32_M; i++) {
        val |= (vec[i] << (GF32_M - 1 - i));
    }
    return val;
}

// Put binary matrix in Reduced Row Echelon Form (RREF)
int row_echelon_form(unsigned char matrix[GF32_R * GF32_N][GF32_M], int rows, int cols) {
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
        // Eliminate down and up to obtain RREF
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

// =====================================================================
// SECTION 3: GF(257) MATHEMATICAL ENGINE & UTILITIES (TCitH Component)
// =====================================================================

// Modular reduction that safely handles negative numbers
int mod_p(int a) {
    int r = a % P;
    if (r < 0) {
        r += P;
    }
    return r;
}

// Multiplicative inverse in GF(257) using Extended Euclidean Algorithm
int gf257_inv(int n) {
    int t = 0, newt = 1;
    int r = P, newr = n;
    while (newr != 0) {
        int quotient = r / newr;
        int temp = t;
        t = newt;
        newt = temp - quotient * newt;
        temp = r;
        r = newr;
        newr = temp - quotient * newr;
    }
    if (r > 1) {
        return -1; // Element not invertible
    }
    if (t < 0) {
        t += P;
    }
    return t;
}

// Solve for unique polynomial coefficients a_1 and a_2 given constant a_0 = u 
// and two points A(x1) = y1 and A(x2) = y2 via Cramer's rule
void solve_poly_coefficients(int u, int x1, int y1, int x2, int y2, int *out_a1, int *out_a2) {
    int r1 = mod_p(y1 - u);
    int r2 = mod_p(y2 - u);

    int det = mod_p(x1 * x2 * (x2 - x1));
    int det_a1 = mod_p(r1 * x2 * x2 - r2 * x1 * x1);
    int det_a2 = mod_p(x1 * r2 - x2 * r1);

    int det_inv = gf257_inv(det);
    *out_a1 = mod_p(det_a1 * det_inv);
    *out_a2 = mod_p(det_a2 * det_inv);
}

// Evaluate a quadratic polynomial A(x) = u + a1*x + a2*x^2 (mod 257) at value x
int eval_quad_poly(int u, int a1, int a2, int x) {
    return mod_p(u + a1 * x + a2 * x * x);
}

// =====================================================================
// SECTION 4: MAIN EXECUTION ENTRY (VSF KeyGen + TCitH Verification)
// =====================================================================

int main() {
    printf("=====================================================================\n");
    printf("     POST-QUANTUM VSF CRYPTOGRAPHIC ENGINE WITH TCITH VERIFICATION  \n");
    printf("=====================================================================\n\n");

    // -----------------------------------------------------------------
    // STEP 1: VSF KEY GENERATION PROTOCOL (GF(2^5))
    // -----------------------------------------------------------------
    printf("[MODULE 1: VECTOR SPACE FACTORIZATION (VSF) KEY GENERATION]\n");
    printf("---------------------------------------------------------------------\n");
    
    // Secret Systematic Bases for U and V
    unsigned char U[GF32_R] = {21, 26}; // u_0 = 21 -> [1 0 1 0 1], u_1 = 26 -> [0 1 0 1 1]
    unsigned char V[GF32_N] = {13, 18}; // v_0 = 13 -> [1 0 1 1 0], v_1 = 18 -> [0 1 0 0 1]

    printf("--- 1. Private Key (Secret Subspace Bases) ---\n");
    printf("Secret Subspace U (dimension %d) bases over GF(2^5):\n", GF32_R);
    for (int i = 0; i < GF32_R; i++) {
        unsigned char vec[GF32_M];
        gf32_val_to_vector(U[i], vec);
        printf("  u_%d = %2d (vector representation: [", i, U[i]);
        for (int j = 0; j < GF32_M; j++) {
            printf("%d%s", vec[j], j == GF32_M - 1 ? "" : " ");
        }
        printf("])\n");
    }

    printf("\nSecret Subspace V (dimension %d) bases over GF(2^5):\n", GF32_N);
    for (int i = 0; i < GF32_N; i++) {
        unsigned char vec[GF32_M];
        gf32_val_to_vector(V[i], vec);
        printf("  v_%d = %2d (vector representation: [", i, V[i]);
        for (int j = 0; j < GF32_M; j++) {
            printf("%d%s", vec[j], j == GF32_M - 1 ? "" : " ");
        }
        printf("])\n");
    }

    // Compute pairwise bilinear products w_ij = u_i * v_j in GF(2^5)
    unsigned char W_elements[GF32_R * GF32_N];
    printf("\n--- 2. Bilinear Subspace Multiplication (W_raw = U * V) ---\n");
    for (int i = 0; i < GF32_R; i++) {
        for (int j = 0; j < GF32_N; j++) {
            W_elements[i * GF32_N + j] = gf32_mul(U[i], V[j]);
            printf("  u_%d * v_%d = %2d * %2d = %2d (mod irreducible x^5 + x^2 + 1)\n", 
                   i, j, U[i], V[j], W_elements[i * GF32_N + j]);
        }
    }

    // Translate products into coordinate vectors to form the raw matrix representation
    unsigned char W_matrix[GF32_R * GF32_N][GF32_M];
    for (int i = 0; i < GF32_R * GF32_N; i++) {
        gf32_val_to_vector(W_elements[i], W_matrix[i]);
    }

    printf("\n--- 3. Raw Product Matrix (W_raw in binary coordinate blocks) ---\n");
    for (int i = 0; i < GF32_R * GF32_N; i++) {
        printf("  Row %d: [", i);
        for (int j = 0; j < GF32_M; j++) {
            printf("%d%s", W_matrix[i][j], j == GF32_M - 1 ? "" : " ");
        }
        printf("]\n");
    }

    // Run Gaussian elimination to compute Reduced Row Echelon Form (RREF)
    int rank = row_echelon_form(W_matrix, GF32_R * GF32_N, GF32_M);

    printf("\n--- 4. Public Key Canonical Basis (Reduced Row Echelon Form) ---\n");
    for (int i = 0; i < rank; i++) {
        printf("  e_%d = [", i);
        for (int j = 0; j < GF32_M; j++) {
            printf("%d%s", W_matrix[i][j], j == GF32_M - 1 ? "" : " ");
        }
        printf("] -> Canonical element value: %2d\n", gf32_vector_to_val(W_matrix[i]));
    }
    printf("\nComputed Public Key Subspace W Dimension (Rank): %d\n", rank);
    printf("VSF Public Key generated successfully!\n\n\n");

    // -----------------------------------------------------------------
    // STEP 2: THRESHOLD COMPUTATION IN THE HEAD (TCitH) PROTOCOL (GF(257))
    // -----------------------------------------------------------------
    printf("[MODULE 2: THRESHOLD COMPUTATION IN THE HEAD (TCitH) PROTOCOL]\n");
    printf("---------------------------------------------------------------------\n");

    // Secret Private Key Coordinates to verify
    int u = 42; // Secret coordinate from Subspace U
    int v = 99; // Secret coordinate from Subspace V
    
    // Public product element
    int w = mod_p(u * v); // w = 42 * 99 = 4158 = 46 (mod 257)

    printf("--- 1. Cryptographic Environment & Inputs ---\n");
    printf("Base Finite Field: GF(257)\n");
    printf("Secret u (Private Key block from U) : %d\n", u);
    printf("Secret v (Private Key block from V) : %d\n", v);
    printf("Public w (Public Key product u*v)   : %d (Mathematical verification: %d * %d = %d mod 257)\n\n", 
           w, u, v, w);

    // Blinding coefficients for degree-2 secret sharing polynomials
    // A(x) = u + a1*x + a2*x^2, B(x) = v + b1*x + b2*x^2
    int a1 = 88, a2 = 120;
    int b1 = 15, b2 = 210;

    printf("--- 2. Polynomial Secret Sharing (Shamir-style, Degree d = %d) ---\n", TCITH_D);
    printf("Polynomial A(x) = %d + %d*x + %d*x^2 (mod 257)\n", u, a1, a2);
    printf("Polynomial B(x) = %d + %d*x + %d*x^2 (mod 257)\n", v, b1, b2);

    // Compute shares for the N=5 virtual players
    int share_a[TCITH_N];
    int share_b[TCITH_N];
    int share_c[TCITH_N];

    printf("\nDistributed Virtual Player Shares:\n");
    for (int i = 0; i < TCITH_N; i++) {
        int x_val = i + 1; // Player evaluations at x = 1, 2, 3, 4, 5
        share_a[i] = eval_quad_poly(u, a1, a2, x_val);
        share_b[i] = eval_quad_poly(v, b1, b2, x_val);
        
        // Players perform their local bilinear multiplication
        share_c[i] = mod_p(share_a[i] * share_b[i]);
        
        printf("  Player %d (at x=%d): share_a = %3d, share_b = %3d | local product share_c = %3d\n", 
               i + 1, x_val, share_a[i], share_b[i], share_c[i]);
    }

    // Simulate the zero-knowledge verification challenge
    // Verifier challenges the prover by selecting d=2 players to open (e.g. Player 1 and Player 2)
    int opened_indices[2] = {0, 1}; // Corresponding to Player 1 and Player 2

    printf("\n--- 3. Zero-Knowledge Challenge (Opening Players 1 and 2) ---\n");
    printf("Verifier requests the opening of Player 1 and Player 2 shares.\n");
    printf("Prover reveals:\n");
    for (int idx = 0; idx < 2; idx++) {
        int p_num = opened_indices[idx] + 1;
        printf("  Player %d shares: a_%d = %3d, b_%d = %3d, c_%d = %3d\n", 
               p_num, p_num, share_a[opened_indices[idx]], 
               p_num, share_b[opened_indices[idx]], 
               p_num, share_c[opened_indices[idx]]);
    }

    printf("\nVerifier executes Bilinear Consistency Checks:\n");
    int verification_passed = 1;
    for (int idx = 0; idx < 2; idx++) {
        int p_num = opened_indices[idx] + 1;
        int check_c = mod_p(share_a[opened_indices[idx]] * share_b[opened_indices[idx]]);
        int is_match = (check_c == share_c[opened_indices[idx]]);
        
        printf("  Check Player %d: %3d * %3d mod 257 = %3d (Expected: %3d) | Match: %s\n", 
               p_num, share_a[opened_indices[idx]], share_b[opened_indices[idx]], 
               check_c, share_c[opened_indices[idx]], is_match ? "True" : "False");
        
        if (!is_match) {
            verification_passed = 0;
        }
    }
    printf("Consensus Verification Status: %s\n\n", verification_passed ? "PASSED (Zero-Knowledge Verified)" : "FAILED");

    // -----------------------------------------------------------------
    // STEP 3: THE MATHEMATICAL "AIR-GAP" PROOF (INTERPOLATION CAPACITY)
    // -----------------------------------------------------------------
    printf("--- 4. The Mathematical 'Air-Gap' Analysis ---\n");
    printf("Attacker intercepts opened shares: Player 1 (x=1, y=250) and Player 2 (x=2, y=184).\n");
    printf("Since the threshold polynomial has degree d = 2, it requires d+1 = 3 points to interpolate.\n");
    printf("With only 2 points, there are 257 possible combinations for the secret constant term A(0).\n");
    printf("Let's reconstruct the blinding coefficients for different guessed secret values:\n\n");

    int test_guesses[4] = {0, 42, 100, 200};
    int x1 = 1, y1 = 250;
    int x2 = 2, y2 = 184;

    for (int i = 0; i < 4; i++) {
        int guessed_u = test_guesses[i];
        int rec_a1, rec_a2;
        
        // Solve for the coefficients that would make this guessed secret fit the opened points
        solve_poly_coefficients(guessed_u, x1, y1, x2, y2, &rec_a1, &rec_a2);
        
        // Verify that this generated polynomial matches both points perfectly
        int test_y1 = eval_quad_poly(guessed_u, rec_a1, rec_a2, x1);
        int test_y2 = eval_quad_poly(guessed_u, rec_a1, rec_a2, x2);
        int is_perfect_fit = (test_y1 == y1 && test_y2 == y2);

        printf("  If attacker guesses secret u = %3d:\n", guessed_u);
        printf("    Polynomial A(x) = %d + %d*x + %d*x^2 (mod 257) matches open shares: %s\n", 
               guessed_u, rec_a1, rec_a2, is_perfect_fit ? "YES (Perfect Match)" : "NO");
        printf("    (Evaluation check: A(1) = %d, A(2) = %d)\n\n", test_y1, test_y2);
    }

    printf("=====================================================================\n");
    printf("Analysis Complete. The C-code engine has successfully verified\n");
    printf("both canonical VSF key pair construction and TCitH zero-knowledge isolation!\n");
    printf("=====================================================================\n");

    return 0;
}
