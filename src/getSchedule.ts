import QueryString from "qs"
import axiosInstance from "./utils/axiosInstance"
import * as cheerio from 'cheerio';
import { IClassFullInfo, IClassInfo } from "./typings/ClassInfo";
import { CLASS_TIME_INFO } from "./utils/consts";
import { clacWeekNumber } from "./utils/dayUtils";
import dayjs from "./utils/dayjs";
import logger from "./utils/logger";
import { RequestError } from "./typings/Error";

export const getScheduleRawData = async (week?: number) => {
  logger.info('requesting schedule')
  const result = await axiosInstance('/jsxsd/xskb/xskb_list.do', {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: QueryString.stringify({
      'zc': week ? week.toString() : ''
    })
  }).then((data) => data.data);
  return result;
}

const convertScheduleData = (rawData: string) => {

  logger.info('converting schedule')

  const $ = cheerio.load(rawData);

  const table = $('#kbtable');

  if (table.length == 0) throw new RequestError("cookie expired");

  const data: (IClassInfo | null)[][] = Array.from({ length: 7 }, () => []);

  table.find('tr').slice(1).each((_, row) => {
    $(row).find('td').each((j, cell) => {
      const tdCell = $(cell).find('.kbcontent');
      if (tdCell.text().replace(/\t/g, '').trim() == '') {
        data[j].push(null);
      } else {
        const name = tdCell.contents().not(tdCell.children()).text();
        const teacher = tdCell.find('[title="老师"]').text();
        const frequency = tdCell.find('[title="周次(节次)"]').text();
        const room = tdCell.find('[title="教室"]').text();
        data[j].push({
          name,
          teacher,
          frequency,
          room
        });
      }
    });
  });

  return data.map((day) => day.slice(0, 5));
}

export const getScheduleData = async (week?: number) => {
  const rawData = await getScheduleRawData(week);
  const data = convertScheduleData(rawData);
  return data;
}

export const getScheduleFullData = async (week?: number): Promise<IClassFullInfo[][]> => {
  const data = await getScheduleData(week);
  return data.map((weekData) => {
    return weekData.map((dayData, i) => {
      return {
        classInfo: dayData,
        timeInfo: CLASS_TIME_INFO[i]
      } as IClassFullInfo
    });
  })
}

export const getTodayScheduleFullData = async () => {
  const weekNumber = clacWeekNumber();
  const rawData = await getScheduleFullData(weekNumber);
  return rawData[dayjs().isoWeekday() - 1];
}

export const getTomorrowScheduleFullData = async () => {
  const weekNumber = clacWeekNumber('tomorrow');
  const rawData = await getScheduleFullData(weekNumber);
  return rawData[dayjs().add(1, 'day').isoWeekday() - 1];
}