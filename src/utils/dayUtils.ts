import { IDayDateData } from "../typings/DayDate";
import { TERM_START_DATE } from "./consts";

import dayjs from "./dayjs";

export const clacWeekNumber = (type: 'today' | 'tomorrow' = 'today') => {
  const startDate = dayjs(TERM_START_DATE);
  const targetDate = type === 'today' ? dayjs() : dayjs().add(1, 'day');
  return targetDate.week() - startDate.week() + 1;
}

export const getDayDateData = (type: 'today' | 'tomorrow' = 'today'): IDayDateData => {
  const startDate = dayjs(TERM_START_DATE);
  const targetDate = type === 'today' ? dayjs() : dayjs().add(1, 'day');
  return {
    type,
    dateString: targetDate.format('YYYY 年 MM 月 DD 日'),
    weekday: targetDate.isoWeekday(),
    weekNumber: targetDate.week() - startDate.week() + 1
  };
}