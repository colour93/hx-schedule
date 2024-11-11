import { chromium } from "playwright";
import * as fs from 'fs';
import * as path from 'path';
import { IClassFullInfo } from "./typings/ClassInfo";
import { IDayDateData } from "./typings/DayDate";
import dayjs from "./utils/dayjs";
import logger from "./utils/logger";

interface IGenInfoData {
  tsString: string
}
export const getScheduleImage = async (data: IClassFullInfo[], dateData: IDayDateData, genInfoData: IGenInfoData = {
  tsString: dayjs().format('YYYY-MM-DD HH:mm:ss')
}) => {

  logger.info('generating schedule image');

  const tempImagePath = path.resolve('temp', `schedule-${+new Date()}.png`);

  // 读取模板 HTML 文件
  const template = fs.readFileSync(path.join('templates', 'daySchedule.html'), 'utf-8');

  const htmlContent = template.replace('{{SCHEDULE_DATA}}', JSON.stringify(data)).replace('{{DATE_DATA}}', JSON.stringify(dateData)).replace('{{GEN_INFO_DATA}}', JSON.stringify(genInfoData));

  const tempHtmlPath = path.resolve('temp', `html-${+new Date()}.html`);

  fs.writeFileSync(tempHtmlPath, htmlContent);

  const browser = await chromium.launch();
  const page = await browser.newPage({
    deviceScaleFactor: 2,
    viewport: {
      width: 600,
      height: 550
    }
  });

  // 设置视口大小为原来的两倍
  // await page.setViewportSize({ width: 1000, height: 400 }); // 根据你的模板大小调整

  // 生成课程表的 HTML 内容
  await page.goto(`file://${tempHtmlPath}`)

  // 等待一段时间以确保内容加载完毕
  await page.waitForTimeout(1000);

  // 截图并保存为图片
  await page.screenshot({ path: tempImagePath, fullPage: true });

  await browser.close();

  return tempImagePath;
}