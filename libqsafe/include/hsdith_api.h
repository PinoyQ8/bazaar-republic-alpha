/**
 * @file hsdith_api.h
 * @brief High-Level API Specification for Hypercube Syndrome Decoding in the Head (H-SDitH)
 * 
 * This header standardizes the C API for the H-SDitH digital signature scheme,
 * aligning with the NIST Post-Quantum Cryptography (PQC) standardization API.
 * 
 * H-SDitH uses the MPC-in-the-Head (MPCitH) paradigm optimized via hypercube 
 * share aggregation over finite fields to build highly efficient, lattice-free
 * post-quantum digital signatures.
 * 
 * @note This specification supports four standard parameter sets for NIST Security Level 1:
 *       - H-FAST: Optimized for signing speed (1.3 ms)
 *       - H-SHORT: Balanced default (2.9 ms, 8.4 KB signature)
 *       - H-SHORTER: Bandwidth optimized (26.4 ms, 6.7 KB signature)
 *       - H-SHORTEST: Space-constrained (320.7 ms, 5.6 KB signature)
 */

#ifndef HSDITH_API_H
#define HSDITH_API_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stddef.h>
#include <stdint.h>

/**
 * @brief Enumeration of supported H-SDitH parameter configurations for NIST Security Level 1.
 */
typedef enum {
    HSDITH_PARAM_H_FAST     = 1, /**< N=32 (D=5), t=27. Sig size: 12,115 Bytes. Sign time: 1.3 ms. */
    HSDITH_PARAM_H_SHORT    = 2, /**< N=256 (D=8), t=17. Sig size: 8,481 Bytes. Sign time: 2.9 ms. */
    HSDITH_PARAM_H_SHORTER  = 3, /**< N=4,096 (D=12), t=12. Sig size: 6,784 Bytes. Sign time: 26.4 ms. */
    HSDITH_PARAM_H_SHORTEST = 4  /**< N=65,536 (D=16), t=9. Sig size: 5,689 Bytes. Sign time: 320.7 ms. */
} hsdith_param_t;

/**
 * @brief Structure containing metadata and static size allocations for a selected parameter set.
 */
typedef struct {
    hsdith_param_t param_set;    /**< The parameter set identifier */
    const char *name;            /**< Human-readable name of the configuration */
    uint32_t q;                  /**< Finite field size Fq */
    uint32_t n;                  /**< Length of the secret error vector */
    uint32_t k;                  /**< Dimension of the code (parity-check matrix H is (n-k) x n) */
    uint32_t d_dimensions;       /**< Dimension D of the hypercube (N = 2^D virtual parties) */
    uint32_t t_repetitions;      /**< Number of protocol repetitions for 128-bit security */
    size_t public_key_bytes;     /**< Size of the public key in bytes */
    size_t private_key_bytes;    /**< Size of the private key in bytes */
    size_t signature_bytes;      /**< Size of the digital signature in bytes */
} hsdith_config_t;

/**
 * @brief Retrieves the configuration parameters for a given H-SDitH parameter set.
 * 
 * @param[out] config Pointer to the configuration structure to populate.
 * @param[in] param_set The chosen parameter configuration identifier.
 * @return int 0 on success, non-zero error code on failure (e.g., invalid parameter set).
 */
int hsdith_get_config(hsdith_config_t *config, hsdith_param_t param_set);

/**
 * @brief Generates an H-SDitH public and private keypair.
 * 
 * The public key (pk) contains the seed for the random parity-check matrix H
 * and the syndrome vector y. The private key (sk) contains the secret,
 * low-weight error vector x (wt(x) <= w) alongside a copy of the public key.
 * 
 * @param[out] pk Buffer to receive the public key. Must be pre-allocated to the size
 *                specified by the configuration's `public_key_bytes`.
 * @param[out] sk Buffer to receive the private key. Must be pre-allocated to the size
 *                specified by the configuration's `private_key_bytes`.
 * @param[in] param_set The chosen parameter configuration identifier.
 * @return int 0 on success, non-zero error code on failure.
 */
int crypto_sign_keypair(
    uint8_t *pk, 
    uint8_t *sk, 
    hsdith_param_t param_set
);

/**
 * @brief Generates a digital signature for a message using the private key.
 * 
 * The signing process simulates the selected number of virtual MPC parties arranged
 * on a D-dimensional hypercube. The linear states are aggregated along each spatial 
 * dimension to produce 2D aggregated shares. These projections are converted into 
 * a non-interactive zero-knowledge proof of knowledge (ZKPoK) of the syndrome decoding
 * witness via the Fiat-Shamir transform.
 * 
 * @param[out] sm Buffer to receive the signed message (contains signature + original message).
 *                Must be pre-allocated to size (`signature_bytes` + `mlen`).
 * @param[out] smlen Pointer to a variable that will receive the total length of the signed message.
 * @param[in] m Pointer to the message buffer to be signed.
 * @param[in] mlen Length of the message in bytes.
 * @param[in] sk Pointer to the private key buffer.
 * @param[in] param_set The chosen parameter configuration identifier.
 * @return int 0 on success, non-zero error code on failure.
 */
int crypto_sign(
    uint8_t *sm, 
    size_t *smlen, 
    const uint8_t *m, 
    size_t mlen, 
    const uint8_t *sk,
    hsdith_param_t param_set
);

/**
 * @brief Verifies a digital signature for a signed message using the public key.
 * 
 * The verifier reconstructs the hypercube aggregation paths for the challenge choices,
 * verifies that the commutative linear properties of the additive secret-sharing scheme 
 * hold (H * sum(x_i) = y mod q), and confirms that the Fiat-Shamir hash evaluation matches
 * the commitments.
 * 
 * @param[out] m Buffer to receive the recovered message. Must be pre-allocated to size `smlen`.
 * @param[out] mlen Pointer to a variable that will receive the length of the recovered message.
 * @param[in] sm Pointer to the signed message buffer (contains signature + message).
 * @param[in] smlen Total length of the signed message.
 * @param[in] pk Pointer to the public key buffer.
 * @param[in] param_set The chosen parameter configuration identifier.
 * @return int 0 if the signature is valid and verification passes, non-zero on verification failure.
 */
int crypto_sign_open(
    uint8_t *m, 
    size_t *mlen, 
    const uint8_t *sm, 
    size_t smlen, 
    const uint8_t *pk,
    hsdith_param_t param_set
);

#ifdef __cplusplus
}
#endif

#endif /* HSDITH_API_H */
