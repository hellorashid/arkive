import { describe, it, expect } from 'vitest';
import { extractAdminUuid } from './extractAdminUuid';
import { basicConfig } from '../basic.config';

describe('extractAdminUuid', () => {
  const expectedUuid = '173a6a44-82aa-47d7-ad8d-79a6bed379fd';

  it('should extract UUID from DID format', () => {
    const did = 'did:web:api.basic.tech:projects:173a6a4482aa47d7ad8d79a6bed379fd';
    expect(extractAdminUuid(did)).toBe(expectedUuid);
  });

  it('should format bare 32-hex string as dashed UUID', () => {
    const bareHex = '173a6a4482aa47d7ad8d79a6bed379fd';
    expect(extractAdminUuid(bareHex)).toBe(expectedUuid);
  });

  it('should accept already-dashed UUID', () => {
    expect(extractAdminUuid(expectedUuid)).toBe(expectedUuid);
  });

  it('should handle uppercase input', () => {
    const upperDid = 'did:web:api.basic.tech:projects:173A6A4482AA47D7AD8D79A6BED379FD';
    expect(extractAdminUuid(upperDid)).toBe(expectedUuid);

    const upperHex = '173A6A4482AA47D7AD8D79A6BED379FD';
    expect(extractAdminUuid(upperHex)).toBe(expectedUuid);

    const upperUuid = '173A6A44-82AA-47D7-AD8D-79A6BED379FD';
    expect(extractAdminUuid(upperUuid)).toBe(expectedUuid);
  });

  it('should return null for invalid formats', () => {
    expect(extractAdminUuid('')).toBe(null);
    expect(extractAdminUuid('not-a-uuid')).toBe(null);
    expect(extractAdminUuid('173a6a44-82aa')).toBe(null); // incomplete UUID
    expect(extractAdminUuid('did:web:example.com')).toBe(null); // DID without UUID
  });

  it('should validate output against Admin UUID regex', () => {
    // This is the exact regex from @basictech/admin
    const adminUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const testCases = [
      'did:web:api.basic.tech:projects:173a6a4482aa47d7ad8d79a6bed379fd',
      '173a6a4482aa47d7ad8d79a6bed379fd',
      '173a6a44-82aa-47d7-ad8d-79a6bed379fd',
    ];

    testCases.forEach((input) => {
      const result = extractAdminUuid(input);
      expect(result).not.toBe(null);
      expect(adminUuidRegex.test(result!)).toBe(true);
    });
  });

  it('should convert the real clientId from basic.config.ts', () => {
    // This is the actual clientId from basic.config.ts
    const realClientId = basicConfig.clientId;
    const result = extractAdminUuid(realClientId);
    
    expect(result).toBe(expectedUuid);
    
    // Verify it passes the Admin UUID regex
    const adminUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(adminUuidRegex.test(result!)).toBe(true);
  });
});
