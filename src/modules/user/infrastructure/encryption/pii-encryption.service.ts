import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface EncryptedField {
    iv: Buffer;
    tag: Buffer;
    data: Buffer;
}

/**
 * Service to encrypt/decrypt Personally Identifiable Information (PII) at rest.
 * Uses AES-256-GCM for authenticated encryption.
 *
 * Case Study Context: Uber stored 57M records (including driver licenses) in
 * plaintext S3 buckets. If attackers compromised the bucket, they had the data.
 * Here, even if the DB is compromised, the attacker only gets ciphertext.
 * The application layer decrypts on-the-fly using keys from the environment.
 */
@Injectable()
export class PiiEncryptionService {
    private readonly algorithm = 'aes-256-gcm';
    private readonly key: Buffer;

    constructor(private configService: ConfigService) {
        const hexKey = this.configService.get<string>('PII_ENCRYPTION_KEY');
        if (!hexKey || hexKey.length !== 64) {
            throw new Error('PII_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes).');
        }
        this.key = Buffer.from(hexKey, 'hex');
    }

    /**
     * Encrypts a plaintext string to an encoded string containing IV + Tag + Data.
     */
    encrypt(plaintext: string): string {
        if (!plaintext) return plaintext;

        // Generate 16-byte cryptographically secure random IV
        const iv = crypto.randomBytes(16);

        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        const encrypted = Buffer.concat([
            cipher.update(plaintext, 'utf8'),
            cipher.final(),
        ]);
        const tag = cipher.getAuthTag(); // 16 bytes for GCM

        // Format: iv:tag:data (all hex encoded)
        return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
    }

    /**
     * Decrypts an encoded string back to plaintext.
     */
    decrypt(encoded: string): string {
        if (!encoded) return encoded;
        if (!encoded.includes(':')) {
            // Legacy or unencrypted data fallback (useful during migrations)
            return encoded;
        }

        const parts = encoded.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const tag = Buffer.from(parts[1], 'hex');
        const encryptedData = Buffer.from(parts[2], 'hex');

        const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
        decipher.setAuthTag(tag);

        const decrypted = decipher.update(encryptedData) + decipher.final('utf8');
        return decrypted;
    }
}
