import logger from './logger.js';

/**
 * Retries an async function a specified number of times.
 * @param {Function} fn - The async function to retry.
 * @param {number} retries - Number of retries.
 * @param {number} delay - Delay between retries in ms.
 * @returns {Promise}
 */
export const retryRequest = async (fn, retries = 3, delay = 2000) => {
    try {
        return await fn();
    } catch (error) {
        if (retries <= 1) {
            throw error;
        }
        logger.warn(`Request failed. Retrying in ${delay}ms... (${retries - 1} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryRequest(fn, retries - 1, delay * 1.5); // Exponential backoff
    }
};
