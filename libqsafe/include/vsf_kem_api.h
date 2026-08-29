/**
 * @file vsf_kem_api.h
 * @brief High-Level API Specification for Vector Space Factorization Key Encapsulation Mechanism (VSF-KEM)
 * 
 * This header standardizes the C API for the VSF-KEM scheme, aligning with the
 * National Institute of Standards and Technology (NIST) Post-Quantum Cryptography
 * (PQC) standardization API guidelines.
 * 
 * VSF-KEM is a lattice-free key exchange mechanism whose security relies on the
 * algebraic hardness of factorizing a multi-dimensional product subspace W = U * V 
 * in F_{q^m} into secret constituent subspaces U (dimension r) and V (dimension n).
 * 
 * @note This specification supports four standard parameter sets for NIST Security Level 1:
 *       - VSF_PARAM_A_256:  q=19,  m=47, r=5, n=5, N=256.  PK size: 293 Bytes.
 *       - VSF_PARAM_A_2048: q=19,  m=47, r=5, n=5, N=2048. PK size: 293 Bytes.
 *       - VSF_PARAM_B_256:  q=128, m=31, r=4, n=4, N=256.  PK size: 210 Bytes.
 *       - VSF_PARAM_B_2048: q=128, m=31, r=4, n=4, N=2048. PK size: 293 Bytes.
 */

#ifndef VSF_KEM_API_H
#define VSF_KEM_API_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stddef.h>
#include <stdint.h>

/**
 * @brief Enumeration of supported VSF-KEM parameter configurations for NIST Security Level 1.
 */
typedef enum {
    VSF_PARAM_A_256    = 1, /**< q=19 (GF(19)),  m=47, r=5, n=5, N=256.  Public Key: 293 B. */
    VSF_PARAM_A_2048   = 2, /**< q=19 (GF(19)),  m=47, r=5, n=5, N=2048. Public Key: 293 B. */
    VSF_PARAM_B_256    = 3, /**< q=128 (GF(128)), m=31, r=4, n=4, N=256.  Public Key: 210 B. */
    VSF_PARAM_B_2048   = 4  /**< q=128 (GF(128)), m=31, r=4, n=4, N=2048. Public Key: 293 B. */
} vsf_kem_param_t;

/**
 * @brief Structure containing metadata and static size allocations for a selected parameter set.
 */
typedef struct {
    vsf_kem_param_t param_set;   /**< The parameter set identifier */
    const char *name;            /**< Human-readable name of the configuration */
    uint32_t q;                  /**< Finite field size Fq */
    uint32_t m;                  /**< Extension degree over the base field */
    uint32_t r;                  /**< Dimension of secret subspace U */
    uint32_t n;                  /**< Dimension of secret subspace V */
    uint32_t tcith_players;      /**< Number of virtual players in the TCitH proof */
    size_t public_key_bytes;     /**< Size of the public key in bytes */
    size_t private_key_bytes;    /**< Size of the private key in bytes */
    size_t ciphertext_bytes;     /**< Size of the encapsulated ciphertext in bytes */
    size_t shared_secret_bytes;  /**< Size of the negotiated shared secret in bytes (typically 32 bytes/256 bits) */
} vsf_kem_config_t;

/**
 * @brief Retrieves the configuration parameters for a given VSF-KEM parameter set.
 * 
 * @param[out] config Pointer to the configuration structure to populate.
 * @param[in] param_set The chosen parameter configuration identifier.
 * @return int 0 on success, non-zero error code on failure (e.g., invalid parameter set).
 */
int vsf_kem_get_config(vsf_kem_config_t *config, vsf_kem_param_t param_set);

/**
 * @brief Generates a VSF-KEM public and private keypair.
 * 
 * The public key (pk) encodes the unique canonical basis of the product subspace
 * W = U * V in systematic Reduced Row Echelon Form (RREF). The private key (sk)
 * contains the systematic coefficients of the secret constituent subspaces U and V.
 * 
 * @param[out] pk Buffer to receive the public key. Must be pre-allocated to the size
 *                specified by the configuration's `public_key_bytes`.
 * @param[out] sk Buffer to receive the private key. Must be pre-allocated to the size
 *                specified by the configuration's `private_key_bytes`.
 * @param[in] param_set The chosen parameter configuration identifier.
 * @return int 0 on success, non-zero error code on failure.
 */
int crypto_kem_keypair(
    uint8_t *pk, 
    uint8_t *sk, 
    vsf_kem_param_t param_set
);

/**
 * @brief Encapsulates a randomly generated shared secret using the recipient's public key.
 * 
 * This routine generates a random ephemeral shared secret (ss), encapsulates it by
 * hiding it within a randomized algebraic challenge, and proves honest construction
 * using the Threshold Computation in the Head (TCitH) paradigm. The resulting 
 * ciphertext (ct) contains both the blinded algebraic challenge and the zero-knowledge
 * proof transcript.
 * 
 * @param[out] ct Buffer to receive the encapsulated ciphertext. Must be pre-allocated
 *                to the size specified by the configuration's `ciphertext_bytes`.
 * @param[out] ss Buffer to receive the negotiated shared secret. Must be pre-allocated
 *                to the size specified by the configuration's `shared_secret_bytes` (32 bytes).
 * @param[in] pk Pointer to the recipient's public key buffer.
 * @param[in] param_set The chosen parameter configuration identifier.
 * @return int 0 on success, non-zero error code on failure.
 */
int crypto_kem_encap(
    uint8_t *ct, 
    uint8_t *ss, 
    const uint8_t *pk, 
    vsf_kem_param_t param_set
);

/**
 * @brief Decapsulates the shared secret from a ciphertext using the private key.
 * 
 * This routine uses the secret constituent subspaces U and V (acting as the algebraic
 * decryption trapdoors) to cleanly factorize and resolve the blinded algebraic 
 * challenge inside the ciphertext. It validates the accompanying ZK proof, verifies
 * honest computation, and extracts the identical 32-byte shared secret (ss).
 * 
 * @param[out] ss Buffer to receive the recovered shared secret. Must be pre-allocated
 *                to the size specified by the configuration's `shared_secret_bytes` (32 bytes).
 * @param[in] ct Pointer to the encapsulated ciphertext buffer.
 * @param[in] sk Pointer to the recipient's private key buffer.
 * @param[in] param_set The chosen parameter configuration identifier.
 * @return int 0 on success if decapsulation passes, non-zero on validation or factorization failure.
 */
int crypto_kem_decap(
    uint8_t *ss, 
    const uint8_t *ct, 
    const uint8_t *sk, 
    vsf_kem_param_t param_set
);

#ifdef __cplusplus
}
#endif

#endif /* VSF_KEM_API_H */
