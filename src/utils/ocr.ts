// @ts-ignore
import { ocr } from 'baidu-aip-sdk';
import logger from './logger';
import { readFileSync } from 'fs';

// 新建一个对象，建议只保存一个对象调用服务接口
const client = new ocr(process.env.OCR_APP_ID, process.env.OCR_APP_KEY, process.env.OCR_SECRET_KEY);

interface IResult {
  words_result: {
    words: string
  }[],
  words_result_num: number;
  log_id: number;
}
export const getVerifyCodeContent = async (data: string) => {
  // 调用通用文字识别, 图片参数为本地图片
  logger.info('recognizing verify code')
  const img = readFileSync(data).toString("base64");
  const result: IResult = await client.generalBasic(img)
  const content = result.words_result[0].words.toLocaleLowerCase().trim().replace(/\ /g, '');
  logger.info(`result is ${content}`);
  return content;
}
