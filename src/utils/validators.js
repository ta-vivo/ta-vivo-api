
/**
 * Check is a string domain name is valid.
 * @param {String} domain 
 * @returns 
 */
const isValidDomain = (domain) => {
  // eslint-disable-next-line no-useless-escape
  try {
    const { hostname, host, protocol } = new URL(domain);
    const isValid = hostname && host && protocol;
    return isValid && host.includes('.');
  } catch (error) {
    return false;
  }
};

/**
 * Check if a string is a valid IPv4 address like 127.0.0.1
 * @param {String} ipaddress 
 * @returns 
 */
function isValidIpv4(ipaddress) {
  const regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return regex.test(ipaddress);
}

/**
 * Check if a string is a valid IPv6 address like http://127.0.0.1
 * @param {String} ipaddress 
 * @returns 
 */
function isValidIpv4WithProtocol(ipaddress) {
  let protocol = ipaddress.startsWith('http://') ? 'http://' : 'https://';

  if (hasPort(ipaddress)) {
    const cleanIp = ipaddress.replace(getPort(ipaddress), '').replace(protocol, '').replace(':', '');
    return isValidIpv4(cleanIp);
  }

  if (protocol) {
    return isValidIpv4(ipaddress.replace(protocol, ''));
  }

  return false;
}

/**
 * 
 * @param {String} url 
 * @returns 
 */
function hasPort(url) {
  const hasMultipleColon = (url.match(/:/g) || []).length;

  return hasMultipleColon > 1;
}

/**
 * 
 * @param {String} url 
 * @returns 
 */
function getPort(url) {
  return url.substring(url.lastIndexOf(':') + 1);
}

export { isValidDomain, isValidIpv4, isValidIpv4WithProtocol };