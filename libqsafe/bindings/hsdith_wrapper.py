import ctypes
import os

# Define H-SDitH Parameter Set Constants
HSDITH_PARAM_H_FAST = 1     # N=32,   t=27
HSDITH_PARAM_H_SHORT = 2    # N=256,  t=17
HSDITH_PARAM_H_SHORTER = 3  # N=4096, t=12
HSDITH_PARAM_H_SHORTEST = 4 # N=65536,t=9

class HsdithConfig(ctypes.Structure):
    """
    ctypes Structure representation of the hsdith_config_t struct.
    """
    _fields_ = [
        ("param_set", ctypes.c_int),
        ("name", ctypes.c_char_p),
        ("q", ctypes.c_uint32),
        ("n", ctypes.c_uint32),
        ("k", ctypes.c_uint32),
        ("d_dimensions", ctypes.c_uint32),
        ("t_repetitions", ctypes.c_uint32),
        ("public_key_bytes", ctypes.c_size_t),
        ("private_key_bytes", ctypes.c_size_t),
        ("signature_bytes", ctypes.c_size_t),
    ]

class HsdithWrapper:
    """
    Python ctypes wrapper for loading and interacting with the H-SDitH Shared C Library.
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
        Standardizes argument and return types to prevent segmentation faults.
        """
        # int hsdith_get_config(hsdith_config_t *config, hsdith_param_t param_set);
        self.lib.hsdith_get_config.argtypes = [
            ctypes.POINTER(HsdithConfig),
            ctypes.c_int
        ]
        self.lib.hsdith_get_config.restype = ctypes.c_int

        # int crypto_sign_keypair(uint8_t *pk, uint8_t *sk, hsdith_param_t param_set);
        self.lib.crypto_sign_keypair.argtypes = [
            ctypes.POINTER(ctypes.c_uint8),
            ctypes.POINTER(ctypes.c_uint8),
            ctypes.c_int
        ]
        self.lib.crypto_sign_keypair.restype = ctypes.c_int

        # int crypto_sign(uint8_t *sm, size_t *smlen, const uint8_t *m, size_t mlen, const uint8_t *sk, hsdith_param_t param_set);
        self.lib.crypto_sign.argtypes = [
            ctypes.POINTER(ctypes.c_uint8),
            ctypes.POINTER(ctypes.c_size_t),
            ctypes.POINTER(ctypes.c_uint8),
            ctypes.c_size_t,
            ctypes.POINTER(ctypes.c_uint8),
            ctypes.c_int
        ]
        self.lib.crypto_sign.restype = ctypes.c_int

        # int crypto_sign_open(uint8_t *m, size_t *mlen, const uint8_t *sm, size_t smlen, const uint8_t *pk, hsdith_param_t param_set);
        self.lib.crypto_sign_open.argtypes = [
            ctypes.POINTER(ctypes.c_uint8),
            ctypes.POINTER(ctypes.c_size_t),
            ctypes.POINTER(ctypes.c_uint8),
            ctypes.c_size_t,
            ctypes.POINTER(ctypes.c_uint8),
            ctypes.c_int
        ]
        self.lib.crypto_sign_open.restype = ctypes.c_int

    def get_config(self, param_set: int) -> HsdithConfig:
        """
        Queries and returns a populated HsdithConfig structure for the selected parameter set.
        """
        config = HsdithConfig()
        result = self.lib.hsdith_get_config(ctypes.byref(config), param_set)
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
        
        result = self.lib.crypto_sign_keypair(pk_buffer, sk_buffer, param_set)
        if result != 0:
            raise RuntimeError("Keypair generation failed during C execution.")
            
        return bytes(pk_buffer), bytes(sk_buffer)

    def sign(self, message: bytes, sk: bytes, param_set: int) -> bytes:
        """
        Signs a message using the given private key and returns the signed message payload.
        """
        config = self.get_config(param_set)
        smlen = ctypes.c_size_t()
        sm_buffer = (ctypes.c_uint8 * (config.signature_bytes + len(message)))()
        
        # Cast Python bytes arrays to ctypes-compatible unsigned char buffers
        sk_arr = (ctypes.c_uint8 * len(sk)).from_buffer_copy(sk)
        m_arr = (ctypes.c_uint8 * len(message)).from_buffer_copy(message)
        
        result = self.lib.crypto_sign(
            sm_buffer, 
            ctypes.byref(smlen), 
            m_arr, 
            len(message), 
            sk_arr, 
            param_set
        )
        if result != 0:
            raise RuntimeError("Message signing failed during C execution.")
            
        return bytes(sm_buffer[:smlen.value])

    def verify(self, signed_message: bytes, pk: bytes, param_set: int) -> bytes:
        """
        Verifies a signed message using the given public key.
        Returns the original message bytes if verification passes, or raises ValueError on forgery.
        """
        mlen = ctypes.c_size_t()
        m_buffer = (ctypes.c_uint8 * len(signed_message))()
        
        pk_arr = (ctypes.c_uint8 * len(pk)).from_buffer_copy(pk)
        sm_arr = (ctypes.c_uint8 * len(signed_message)).from_buffer_copy(signed_message)
        
        result = self.lib.crypto_sign_open(
            m_buffer, 
            ctypes.byref(mlen), 
            sm_arr, 
            len(signed_message), 
            pk_arr, 
            param_set
        )
        if result != 0:
            raise ValueError("Signature verification FAILED. The message may have been altered or forged.")
            
        return bytes(m_buffer[:mlen.value])

# Demo execution layout
if __name__ == "__main__":
    import tempfile
    print("=====================================================================")
    print("         H-SDITH PYTHON CTYPES WRAPPER ENVIRONMENT                   ")
    print("=====================================================================")
    print("To execute this wrapper locally, compile the H-SDitH source code into")
    print("a shared library first:")
    print("  $ gcc -O3 -shared -fPIC -o libhsdith.so hsdith_implementation.c")
    print("\nThen initialize and interact with the API directly in Python:")
    print("  >>> wrapper = HsdithWrapper('./libhsdith.so')")
    print("  >>> pk, sk = wrapper.keypair(HSDITH_PARAM_H_SHORT)")
    print("  >>> signed_msg = wrapper.sign(b'Secure Data Transmit', sk, HSDITH_PARAM_H_SHORT)")
    print("  >>> original_msg = wrapper.verify(signed_msg, pk, HSDITH_PARAM_H_SHORT)")
    print("=====================================================================")
