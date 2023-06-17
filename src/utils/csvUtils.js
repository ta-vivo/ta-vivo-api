import { stringify } from 'csv-stringify';

/**
 * Take an array of headers (strings) and an matrix of data (array[array[string]]) and convert it into CSV
 * @param {Array.<String>} headers
 * @param {Array.<Array.<String>>} data
 * @returns {Promise.<String>}
 */
const createCSVString = async (headers, data) => {
  return new Promise((resolve, reject) => {
    stringify([headers, ...data], (err, output) => {
      if (err) reject(err);
      resolve(output);
    });
  });
};

export { createCSVString };
