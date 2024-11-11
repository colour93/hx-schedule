import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);
dayjs.extend(weekOfYear);
dayjs.extend(customParseFormat);
dayjs.extend(isoWeek);

const defaultTimezone = 'Asia/Shanghai';

const dayjsInstance = (date?: dayjs.ConfigType, format?: dayjs.OptionType, locale?: string, strict?: boolean) => dayjs(date, format, locale, strict).tz(defaultTimezone);

export default dayjsInstance;