/**
 * @file qsd_kem_api.h
 * @brief High-Level API Specification for Quantum Stabilizer Decoding Key Encapsulation Mechanism (QSD-KEM)
 * 
 * This header standardizes the C API for the QSD-KEM scheme, aligning with the
 * National Institute of Standards and Technology (NIST) Post-Quantum Cryptography
 * (PQC) standardization API guidelines.
 * 
 * QSD-KEM is a quantum-native, lattice-free key exchange mechanism whose security
 * is grounded in the difficulty of decoding random quantum stabilizer codes. While
 * native to quantum physics, it admits a purely classical input/output formulation
 * (STOC '26), allowing it to run natively on classical silicon.
 * 
 * The scheme leverages the 'symplectic algebraic structure' of Pauli operators over
 * F2^{2n} to block classical LPN reductions, creating a highly secure post-quantum trapdoor.
 */

#ifndef QSD_KEM_API_H
#define QSD_KEM_API_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stddef.h>
#include <stdint.h>

/**
 * @brief Enumeration of supported QSD-KEM parameter configurations for NIST Security Levels.
 */
typedef enum {
    QSD_PARAM_L1 = 1, /**< Level 1 (128-bit key): n=256 qubits, k=128 logical, w=16 error weight. */
    QSD_PARAM_L3 = 2, /**< Level 3 (192-bit key): n=384 qubits, k=192 logical, w=24 error weight. */
    QSD_PARAM_L5 = 3  /**< Level 5 (256-bit key): n=512 qubits, k=256 logical, w=32 error weight. */
} qsd_kem_param_t;

/**
 * @brief Structure containing metadata and static size allocations for a selected QSD parameter set.
 */
typedef struct {
    qsd_kem_param_t param_set;   /**< The parameter set identifier */
    const char *name;            /**< Human-readable name of the configuration */
    uint32_t n_qubits;           /**< Number of physical qubits (simulated code length) */
    uint32_t k_logical;          /**< Number of logical qubits (code dimension) */
    uint32_t max_error_weight;   /**< Maximum weight of the simulated Pauli error vector */
    size_t public_key_bytes;     /**< Size of the public key in bytes */
    size_t private_key_bytes;    /**< Size of the private key in bytes */
    size_t ciphertext_bytes;     /**< Size of the encapsulated ciphertext in bytes */
    size_t shared_secret_bytes;  /**< Size of the negotiated shared secret in bytes (typically 32 bytes/256 bits) */
} qsd_kem_config_t;

/**
 * @brief Retrieves the configuration parameters for a given QSD-KEM parameter set.
 * 
 * @param[out] config Pointer to the configuration structure to populate.
 * @param[in] param_set The chosen parameter configuration identifier.
 * @return int 0 on success, non-zero error code on failure (e.g., invalid parameter set).
 */
int qsd_kem_get_config(qsd_kem_config_t *config, qsd_kem_param_t param_set);

/**
 * @brief Generates a QSD-KEM public and private keypair.
 * 
 * The public key (pk) contains the self-orthogonal classical stabilizer check matrix
 * H = (H_X | H_Z) and a public syndrome vector s. The private key (sk) contains
 * the secret, low-weight Pauli error vector e = (u | v) which acts as the algebraic
 * decryption trapdoor.
 * 
 * @param[out] pk Buffer to receive the public key. Must be pre-allocated to the size
 *                specified by the configuration's `public_key_bytes`.
 * @param[out] sk Buffer to receive the private key. Must be pre-allocated to the size
 *                specified by the configuration's `private_key_bytes`.
 * @param[in] param_set The chosen parameter configuration identifier.
 * @return int 0 on success, non-zero error code on failure.
 */
int crypto_qsd_kem_keypair(
    uint8_t *pk, 
    uint8_t *sk, 
    qsd_kem_param_t param_set
);

/**
 * @brief Encapsulates a randomly generated shared secret using the recipient's public key.
 * 
 * This routine generates a random 256-bit shared secret (ss), blinds it with a random 
 * symplectic challenge on the public stabilizer matrix H, and encapsulates it inside a
 * ciphertext (ct). The ciphertext includes both the syndrome challenge and a classical 
 * stabilizer proof showing that the noise coordinates preserve the Sp_2n(F2) structural constraints.
 * 
 * @param[out] ct Buffer to receive the encapsulated ciphertext. Must be pre-allocated
 *                to the size specified by the configuration's `ciphertext_bytes`.
 * @param[out] ss Buffer to receive the negotiated shared secret. Must be pre-allocated
 *                to the size specified by the configuration's `shared_secret_bytes` (32 bytes).
 * @param[in] pk Pointer to the recipient's public key buffer.
 * @param[in] param_set The chosen parameter configuration identifier.
 * @return int 0 on success, non-zero error code on failure.
 */
int crypto_qsd_kem_encap(
    uint8_t *ct, 
    uint8_t *ss, 
    const uint8_t *pk, \
    qsd_kem_param_t param_set
);

/**
 * @brief Decapsulates the shared secret from a ciphertext using the private key.
 * 
 * This routine uses the private key (containing the secret low-weight Pauli error e = (u | v))
 * to decapsulate the secret. Because the variables are coupled via the symplectic inner
 * product, the recipient can quickly strip the error noise, verify the symplectic constraints,
 * and reconstruct the identical 32-byte shared secret (ss).
 * 
 * @param[out] ss Buffer to receive the recovered shared secret. Must be pre-allocated
 *                to the size specified by the configuration's `shared_secret_bytes` (32 bytes).
 * @param[in] ct Pointer to the encapsulated ciphertext buffer.
 * @param[in] sk Pointer to the recipient's private key buffer.
 * @param[in] param_set The chosen parameter configuration identifier.
 * @return int 0 on success if decapsulation passes, non-zero on validation or symplectic failure.
 */
int crypto_qsd_kem_decap(
    uint8_t *ss, \
    const uint8_t *ct, \
    const uint8_t *sk, \
    qsd_kem_param_t param_set
);

#ifdef __cplusplus
}
#endif

#endif /* QSD_KEM_API_H */
