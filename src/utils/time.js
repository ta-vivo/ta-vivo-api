import dayjs from 'dayjs';
import timezonePlugin from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

/**
 * This function returns the current date in the specified timezone and format.
 * @param [timezone=UTC] - The timezone you want to use.
 * @param [format=MM-DD-YYYY HH:mm:ss] - The format of the date you want to return.
 * @returns A string of the current date in the format MM-DD-YYYY HH:mm:ss
 */
const getCurrentDate = (timezone = 'UTC', format = 'MM-DD-YYYY HH:mm:ss') => {
  return dayjs(new Date()).tz(timezone).format(format);
};

export { getCurrentDate };