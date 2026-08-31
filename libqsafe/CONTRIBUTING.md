# Contributing to libqsafe & pyqsafe

Thank you for helping us build **`libqsafe`** and **`pyqsafe`**, a unified, lattice-free, crypto-agile software library! By contributing to this project, you are helping to build robust, alternative post-quantum cryptographic primitives to secure the global digital infrastructure against future quantum threats.

To maintain the absolute mathematical integrity and performance standards of this library, we enforce a strict code of conduct, rigorous code-style rules, and comprehensive testing policies. Please read this guide before opening a Pull Request (PR).

---

## 1. Cryptographic and Code Style Standards

### Core C Library (`libqsafe`)
*   **Language Standard**: ANSI C11. The code must compile cleanly with `-std=c11 -Wall -Wextra -Wpedantic` on GCC and Clang.
*   **External Dependencies**: **Zero.** No external libraries (except standard ANSI C libraries like `<stdint.h>`, `<stddef.h>`, and `<string.h>`) are allowed within the core implementations.
*   **Memory Management**: Static memory allocation is heavily preferred. Dynamic memory allocation (`malloc`/`free`) must be avoided inside critical path signing, verification, encapsulation, or decapsulation functions to prevent memory fragmentation and leakage.

### Python Bindings (`pyqsafe`)
*   **Language Standard**: Python 3.12+.
*   **Formatting**: Strict adherence to PEP 8. Line length must not exceed 100 characters.
*   **Type Safety**: Every public class and method must have complete type annotations.
*   **ctypes Bindings**: All interaction with the compiled C library must use the predefined, type-safe structures in `ctypes`. Argument and return types (`argtypes` and `restype`) must be declared explicitly.

---

## 2. Hardening and Security Mandates (Non-Negotiable)

Any PR affecting cryptographic operations is subject to an automated and manual security review. Your code must adhere to these three core hardening rules:

### A. Constant-Time Execution
To mitigate timing-attack side-channel vectors, all operations (specifically Gaussian-Jordan elimination, matrix multiplications, polynomial evaluations, and ZK proof checks) must run in constant time.
*   ❌ **No secret-dependent branching**: Do not use `if`, `else`, `while`, or `for` loops where the condition or loop count depends on private key coordinates or secret vectors.
*   ❌ **No secret-dependent memory lookups**: Array indexing (such as `array[secret_val]`) is prohibited if the index depends on private key blocks. Use bitwise select operations instead:
    ```c
    // Constant-time selection: returns 'a' if mask is 0xFF, 'b' if mask is 0x00
    unsigned char ct_select(unsigned char a, unsigned char b, unsigned char mask) {
        return (a & mask) | (b & ~mask);
    }
    ```

### B. Symplectic Form Preservation
Any modifications to the Phase 3 Quantum Stabilizer Decoding (QSD) core matrices or linear transformations must preserve the symplectic structure of the vector space:
*   Every transformation matrix $\mathbf{M}$ must satisfy the symplectic condition:
    $$\mathbf{M} \mathbf{\Omega} \mathbf{M}^T = \mathbf{\Omega} \pmod 2$$
*   All generated stabilizer matrices must commute perfectly:
    $$\mathbf{H}_X \mathbf{H}_Z^T + \mathbf{H}_Z \mathbf{H}_X^T = \mathbf{0} \pmod 2$$

### C. Zero-Knowledge Integrity
In Phase 2 Vector Space Factorization (VSF), the Threshold Computation in the Head (TCitH) protocol must retain its absolute mathematical "air-gap". Proving polynomials of degree $d$ must never reveal more than $d$ evaluation shares to the verifier, ensuring the private key remains statistically indistinguishable from random noise.

---

## 3. Pull Request (PR) Requirements

Before submitting your PR, ensure it meets these requirements:

1.  **Issue Linkage**: Every PR must reference an open issue detailing the bug or feature request.
2.  **Conventional Commits**: Commit messages must follow the Conventional Commits specification. Examples:
    *   `feat(vsf): implement constant-time RREF using bitwise select`
    *   `fix(hsdith): correct memory leak in hypercube share aggregation`
    *   `test(qsd): add unit tests for 5-qubit commutativity checks`
3.  **Performance Verification**: If your PR modifies the performance characteristics of an algorithm, you must run the local benchmark suite and append the output log to the PR description.
4.  **Mathematical Proof**: Contributions that introduce new parameters or modify polynomial sizes must contain a LaTeX-style mathematical proof justifying that the security bounds against hybrid combinatorial-Gröbner basis attacks remain above $2^{128}$ operations.

---

## 4. Testing and Automated Benchmarking

### The Local Testing Harness
All contributions must compile and execute cleanly using our automated testing suite:

```bash
# 1. Clean the environment and compile both engines
make clean && make

# 2. Run the automated benchmarking and testing harness
./test_runner.sh
```

`test_runner.sh` will verify:
*   The compilation completes with zero warnings.
*   Our toy GF($2^5$) VSF Key Generator correctly computes the public key dimensions (rank must equal 4).
*   Our GF(257) TCitH consensus check passes seamlessly.
*   Our classical 5-qubit QSD commutativity and syndrome extraction checks verify perfectly.
*   Execution timings (in nanoseconds) are recorded and compared.

### Python Bindings Validation
Run our test suite to verify that your ctypes wrappers are driving the compiled binaries correctly:

```bash
python3 bindings/hsdith_wrapper.py
python3 bindings/vsf_kem_wrapper.py
python3 bindings/qsd_kem_wrapper.py
```

---

## 5. Security Policy and Vulnerability Disclosure

If you discover a potential security vulnerability (especially side-channel leakages or cryptanalytic breaks), **do not open a public issue.** Instead, please send a detailed, encrypted report to the project's security team at `security@libqsafe.org`. We will coordinate with you to verify and patch the vulnerability in a private branch before making a public disclosure.
