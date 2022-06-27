
/**
 * It returns a string containing the current date and time in the format:
 * DD/MM/YYYY HH:MM:SS
 * @returns A string with the current date and time.
 */
const getCurrentDate = ()  => {
  const dateTime = new Date();
  const dateTimeString = `${dateTime.getDate()}/${dateTime.getMonth()}/${dateTime.getFullYear()} ${dateTime.getHours()}:${dateTime.getMinutes()}:${dateTime.getSeconds()}`;
  return dateTimeString;
};

export { getCurrentDate };