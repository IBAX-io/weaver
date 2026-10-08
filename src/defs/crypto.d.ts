/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Key and hash algorithms a node reports in /getuid (go-ibax packages/common/crypto)
declare module 'ibax/crypto' {
  type TCryptoer = 'ECC_P256' | 'ECC_Secp256k1' | 'SM2' | 'ECC_P512' | 'MLDSA65' | 'MLDSA87';
  type THasher = 'SHA256' | 'KECCAK256' | 'SHA3_256' | 'SM3' | 'SHA384' | 'SHA512';

  interface ICryptoSuiteId {
    readonly cryptoer: TCryptoer;
    readonly hasher: THasher;
  }
}
