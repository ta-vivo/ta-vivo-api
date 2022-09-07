import crypto from 'crypto';

const algorithm = 'aes-256-ctr';

/**
 * It takes a string, encrypts it, and returns an object with the encrypted string and the
 * initialization vector
 * @param text - The text to be encrypted.
 * @returns An object with two properties: iv and content.
 */
const encrypt = (text) => {

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, process.env.CRYPTO_SECRET, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex')
  };
};


/**
 * It takes a hash object, creates a decipher object using the algorithm, secret, and iv, then decrypts
 * the content and returns the decrypted string
 * @param object - The encrypted object {iv: '', content: ''}
 * @returns The decrypted string.
 */
const decrypt = (hash) => {

  const decipher = crypto.createDecipheriv(algorithm, process.env.CRYPTO_SECRET, Buffer.from(hash.iv, 'hex'));
  const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);

  return decrpyted.toString();
};

export { encrypt, decrypt };