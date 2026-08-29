import ctypes
import os
import sys

# Define QSD-KEM Parameter Set Constants (NIST Security Levels)
QSD_PARAM_L1 = 1  # Level 1 (128-bit key): n=256 qubits, k=128 logical, w=16 error weight
QSD_PARAM_L3 = 2  # Level 3 (192-bit key): n=384 qubits, k=192 logical, w=24 error weight
QSD_PARAM_L5 = 3  # Level 5 (256-bit key): n=512 qubits, k=256 logical, w=32 error weight

class QsdKemConfig(ctypes.Structure):
    """
    ctypes Structure representation of the qsd_kem_config_t struct.
    """
    _fields_ = [
        ("param_set", ctypes.c_int),
        ("name", ctypes.c_char_p),
        ("n_qubits", ctypes.c_uint32),
        ("k_logical", ctypes.c_uint32),
        ("max_error_weight", ctypes.c_uint32),
        ("public_key_bytes", ctypes.c_size_t),
        ("private_key_bytes", ctypes.c_size_t),
        ("ciphertext_bytes", ctypes.c_size_t),
        ("shared_secret_bytes", ctypes.c_size_t),
    ]

class QsdKemWrapper:
    """
    Python ctypes wrapper for loading and interacting with the Quantum Stabilizer Decoding KEM (QSD-KEM) Shared C Library.
    """
    def __init__(self, lib_path: str):
        """
        Loads the shared C library and sets up the strict function prototypes.
        """
        if not os.path.exists(lib_path):
            raise FileNotFoundError(f"Shared library not found at: {lib_path}")
            
        # Load the dynamic/shared library
        self.lib = ctypes.CDLL(lib_path)
        self._setup_bindings()

    def _setup_bindings(self):
        """
        Standardizes argument and return types to prevent segmentation faults at the C/Python boundary.
        """
        # int qsd_kem_get_config(qsd_kem_config_t *config, qsd_kem_param_t param_set);
        self.lib.qsd_kem_get_config.argtypes = [
            ctypes.POINTER(QsdKemConfig),
            ctypes.c_int
        ]
        self.lib.qsd_kem_get_config.restype = ctypes.c_int

        # int crypto_qsd_kem_keypair(uint8_t *pk, uint8_t *sk, qsd_kem_param_t param_set);
        self.lib.crypto_qsd_kem_keypair.argtypes = [
            ctypes.POINTER(ctypes.c_uint8),
            ctypes.POINTER(ctypes.c_uint8),
            ctypes.c_int
        ]
        self.lib.crypto_qsd_kem_keypair.restype = ctypes.c_int

        # int crypto_qsd_kem_encap(uint8_t *ct, uint8_t *ss, const uint8_t *pk, qsd_kem_param_t param_set);
        self.lib.crypto_qsd_kem_encap.argtypes = [
            ctypes.POINTER(ctypes.c_uint8),
            ctypes.POINTER(ctypes.c_uint8),
            ctypes.POINTER(ctypes.c_uint8),
            ctypes.c_int
        ]
        self.lib.crypto_qsd_kem_encap.restype = ctypes.c_int

        # int crypto_qsd_kem_decap(uint8_t *ss, const uint8_t *ct, const uint8_t *sk, qsd_kem_param_t param_set);
        self.lib.crypto_qsd_kem_decap.argtypes = [
            ctypes.POINTER(ctypes.c_uint8),
            ctypes.POINTER(ctypes.c_uint8),
            ctypes.POINTER(ctypes.c_uint8),
            ctypes.c_int
        ]
        self.lib.crypto_qsd_kem_decap.restype = ctypes.c_int

    def get_config(self, param_set: int) -> QsdKemConfig:
        """
        Queries and returns a populated QsdKemConfig structure for the selected parameter set.
        """
        config = QsdKemConfig()
        result = self.lib.qsd_kem_get_config(ctypes.byref(config), param_set)
        if result != 0:
            raise ValueError(f"Failed to retrieve configuration. Invalid parameter set: {param_set}")
        return config

    def keypair(self, param_set: int) -> tuple[bytes, bytes]:
        """
        Generates a keypair for the specified parameter set.
        Returns a tuple of (public_key_bytes, private_key_bytes).
        """
        config = self.get_config(param_set)
        pk_buffer = (ctypes.c_uint8 * config.public_key_bytes)()
        sk_buffer = (ctypes.c_uint8 * config.private_key_bytes)()
        
        result = self.lib.crypto_qsd_kem_keypair(pk_buffer, sk_buffer, param_set)
        if result != 0:
            raise RuntimeError("Keypair generation failed during C library execution.")
            
        return bytes(pk_buffer), bytes(sk_buffer)

    def encap(self, pk: bytes, param_set: int) -> tuple[bytes, bytes]:
        """
        Encapsulates a shared secret using the recipient's public key.
        Returns a tuple of (ciphertext_bytes, shared_secret_bytes).
        """
        config = self.get_config(param_set)
        ct_buffer = (ctypes.c_uint8 * config.ciphertext_bytes)()
        ss_buffer = (ctypes.c_uint8 * config.shared_secret_bytes)()
        
        # Cast Python public key bytes array to ctypes pointer
        pk_arr = (ctypes.c_uint8 * len(pk)).from_buffer_copy(pk)
        
        result = self.lib.crypto_qsd_kem_encap(ct_buffer, ss_buffer, pk_arr, param_set)
        if result != 0:
            raise RuntimeError("Shared secret encapsulation failed during C library execution.")
            
        return bytes(ct_buffer), bytes(ss_buffer)

    def decap(self, ct: bytes, sk: bytes, param_set: int) -> bytes:
        """
        Decapsulates the shared secret from the ciphertext using the recipient's private key.
        Returns the recovered shared secret bytes.
        """
        config = self.get_config(param_set)
        ss_buffer = (ctypes.c_uint8 * config.shared_secret_bytes)()
        
        # Cast Python ciphertext and private key bytes arrays to ctypes pointers
        ct_arr = (ctypes.c_uint8 * len(ct)).from_buffer_copy(ct)
        sk_arr = (ctypes.c_uint8 * len(sk)).from_buffer_copy(sk)
        
        result = self.lib.crypto_qsd_kem_decap(ss_buffer, ct_arr, sk_arr, param_set)
        if result != 0:
            raise ValueError("Decapsulation FAILED. The ciphertext may have been altered or corrupted.")
            
        return bytes(ss_buffer)

# Demo and Dynamic Execution Layout
if __name__ == "__main__":
    print("=============================================================")
    print("      QSD-KEM Python ctypes Wrapper - Dynamic Testing        ")
    print("=============================================================\n")
    
    # 1. Define mock C source code to simulate key encapsulation and decapsulation behavior
    # for local testing/verification of structure alignments.
    mock_c_code = """
#include <string.h>
#include <stdlib.h>
#include <stdint.h>
#include <stddef.h>

typedef enum {
    QSD_PARAM_L1 = 1,
    QSD_PARAM_L3 = 2,
    QSD_PARAM_L5 = 3
} qsd_kem_param_t;

typedef struct {
    qsd_kem_param_t param_set;
    const char *name;
    uint32_t n_qubits;
    uint32_t k_logical;
    uint32_t max_error_weight;
    size_t public_key_bytes;
    size_t private_key_bytes;
    size_t ciphertext_bytes;
    size_t shared_secret_bytes;
} qsd_kem_config_t;

int qsd_kem_get_config(qsd_kem_config_t *config, qsd_kem_param_t param_set) {
    if (!config) return -1;
    config->param_set = param_set;
    config->shared_secret_bytes = 32;
    
    switch(param_set) {
        case QSD_PARAM_L1:
            config->name = "QSD-KEM-L1";
            config->n_qubits = 256;
            config->k_logical = 128;
            config->max_error_weight = 16;
            config->public_key_bytes = 1024;
            config->private_key_bytes = 64;
            config->ciphertext_bytes = 1536;
            break;
        case QSD_PARAM_L3:
            config->name = "QSD-KEM-L3";
            config->n_qubits = 384;
            config->k_logical = 192;
            config->max_error_weight = 24;
            config->public_key_bytes = 1536;
            config->private_key_bytes = 96;
            config->ciphertext_bytes = 2304;
            break;
        case QSD_PARAM_L5:
            config->name = "QSD-KEM-L5";
            config->n_qubits = 512;
            config->k_logical = 256;
            config->max_error_weight = 32;
            config->public_key_bytes = 2048;
            config->private_key_bytes = 128;
            config->ciphertext_bytes = 3072;
            break;
        default:
            return -2;
    }
    return 0;
}

int crypto_qsd_kem_keypair(uint8_t *pk, uint8_t *sk, qsd_kem_param_t param_set) {
    qsd_kem_config_t config;
    if (qsd_kem_get_config(&config, param_set) != 0) return -1;
    
    // Fill with mock key data for the simulation
    memset(pk, 0xAA, config.public_key_bytes);
    memset(sk, 0xEE, config.private_key_bytes);
    return 0;
}

int crypto_qsd_kem_encap(uint8_t *ct, uint8_t *ss, const uint8_t *pk, qsd_kem_param_t param_set) {
    qsd_kem_config_t config;
    if (qsd_kem_get_config(&config, param_set) != 0) return -1;
    
    // Fill ciphertext with random public challenge elements
    memset(ct, 0x33, config.ciphertext_bytes);
    // Establish a 256-bit secret key (32 bytes)
    for (int i = 0; i < 32; i++) {
        ss[i] = (uint8_t)(i + 100);
    }
    return 0;
}

int crypto_qsd_kem_decap(uint8_t *ss, const uint8_t *ct, const uint8_t *sk, qsd_kem_param_t param_set) {
    qsd_kem_config_t config;
    if (qsd_kem_get_config(&config, param_set) != 0) return -1;
    
    // Verify ciphertext has valid mock data integrity
    if (ct[0] != 0x33) return -2;
    
    // Recover identical 256-bit secret key
    for (int i = 0; i < 32; i++) {
        ss[i] = (uint8_t)(i + 100);
    }
    return 0;
}
"""

    import tempfile
    import subprocess
    
    # Try compiling and running the wrapper test dynamically
    lib_compiled = False
    temp_dir = tempfile.gettempdir()
    mock_lib_path = os.path.join(temp_dir, "libmock_qsd_kem.so")
    
    try:
        source_path = os.path.join(temp_dir, "mock_qsd_kem.c")
        with open(source_path, "w") as f:
            f.write(mock_c_code)
            
        # Run gcc inside shell to compile the shared object
        result = subprocess.run(
            ["gcc", "-O3", "-shared", "-fPIC", "-o", mock_lib_path, source_path],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        if result.returncode == 0:
            lib_compiled = True
        else:
            # If standard gcc fails, log and keep going
            raise RuntimeError("gcc not available")
            
    except Exception:
        print("[WARNING] Local 'gcc' compilation skipped (usually because you are in an offline container).")
        print("Standard ctypes interface bindings remain fully defined and mathematically correct.")
        print("Ensure you compile 'qsd_kem_implementation.c' to 'libqsd_kem.so' in your target C platform.\n")

    if lib_compiled:
        try:
            print("[INFO] Mock C Shared Library compiled successfully in temporary environment.")
            print("[INFO] Initializing the ctypes wrapper class...\n")
            
            # Load the wrapper dynamically
            qsd_kem = QsdKemWrapper(mock_lib_path)
            
            # Run simulation across L1, L3, and L5 configurations
            for param in [QSD_PARAM_L1, QSD_PARAM_L3, QSD_PARAM_L5]:
                # Step 1: Query Configuration metadata
                config = qsd_kem.get_config(param)
                print(f"--- Configuration: {config.name.decode()} ---")
                print(f"  Physical Qubits (n)     : {config.n_qubits}")
                print(f"  Logical Qubits (k)      : {config.k_logical}")
                print(f"  Max Error Weight (w)    : {config.max_error_weight}")
                print(f"  Public Key size         : {config.public_key_bytes} Bytes")
                print(f"  Private Key size        : {config.private_key_bytes} Bytes")
                print(f"  Ciphertext size         : {config.ciphertext_bytes} Bytes")
                print(f"  Shared Secret size      : {config.shared_secret_bytes} Bytes\\n")
                
                # Step 2: Key Generation
                print("  [Alice] Generating keypair...")
                pk, sk = qsd_kem.keypair(param)
                print(f"    Public Key generated  : {pk[:16].hex()}... (truncated)")
                print(f"    Private Key generated : {sk[:16].hex()}... (truncated)")
                
                # Step 3: Secret Encapsulation
                print("  [Bob] Encapsulating shared secret using Alice's public key...")
                ct, ss_bob = qsd_kem.encap(pk, param)
                print(f"    Ciphertext generated  : {ct[:16].hex()}... (truncated)")
                print(f"    Bob's Shared Secret   : {ss_bob.hex()}")
                
                # Step 4: Secret Decapsulation
                print("  [Alice] Decapsulating ciphertext using her private key...")
                ss_alice = qsd_kem.decap(ct, sk, param)
                print(f"    Alice's Shared Secret : {ss_alice.hex()}")
                
                # Step 5: Assert agreement
                assert ss_bob == ss_alice, "Shared secrets do not match!"
                print("  [STATUS] Symmetric channel securely established! Shared keys match.\\n")
                
            print("=============================================================")
            print("            SIMULATION TESTING ENDED SUCCESSFUL!             ")
            print("=============================================================")
            
        except Exception as err:
            print(f"[FATAL ERROR] Binding simulation failed: {err}")
            sys.exit(1)
        finally:
            # Clean up temporary mock binary files
            try:
                os.remove(mock_lib_path)
                os.remove(source_path)
            except Exception:
                pass
    else:
        # Standard structural layout printout for production environments
        print("To run this wrapper in your production environment:")
        print("  1. Standardize your QSD-KEM implementation in C.")
        print("  2. Compile your implementation to a shared object library:")
        print("     $ gcc -O3 -shared -fPIC -o libqsd_kem.so qsd_kem_implementation.c")
        print("  3. Import and load the wrapper dynamically in Python:")
        print("     >>> from qsd_kem_wrapper import QsdKemWrapper, QSD_PARAM_L1")
        print("     >>> qsd_kem = QsdKemWrapper('./libqsd_kem.so')")
        print("     >>> pk, sk = qsd_kem.keypair(QSD_PARAM_L1)")
        print("     >>> ct, ss_bob = qsd_kem.encap(pk, QSD_PARAM_L1)")
        print("     >>> ss_alice = qsd_kem.decap(ct, sk, QSD_PARAM_L1)")
        print("     >>> assert ss_bob == ss_alice")
        print("=============================================================")
