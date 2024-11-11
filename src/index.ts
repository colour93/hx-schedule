import logger from './utils/logger';

import { config } from 'dotenv';
config();

logger.info('starting');

import express from 'express';

import { getTodayScheduleFullData, getTomorrowScheduleFullData } from "./getSchedule";
import { getScheduleImage } from "./getScheduleImage";
import { getDayDateData } from "./utils/dayUtils";
import { RequestError } from './typings/Error';
import { loginViaPlaywrightAuto } from './auth';

const app = express();

app.get('/', (_, res) => {
  res.send({
    code: 200,
    msg: '',
    data: +new Date()
  })
})

const genImage = async (type: 'today' | 'tomorrow' = 'today') => {
  try {
    const data = type === 'today' ? await getTodayScheduleFullData() : await getTomorrowScheduleFullData();
    return await getScheduleImage(data, getDayDateData(type));
  } catch (error) {
    if (error instanceof RequestError) {
      if (error.message === 'cookie expired') {
        logger.error('cookie expired');
        const result = await loginViaPlaywrightAuto();
        if (result) return await genImage(type);
        return;
      }
    }
    console.error(error);
  }
}

app.get('/image', async (req, res) => {
  const { sk, type } = req.query;
  if (!sk || sk != process.env.EXPRESS_SECRET_KEY) {
    res.status(400).send({
      code: 400,
      msg: 'bad request'
    });
    return;
  }
  const filePath = await genImage(type as 'today' | 'tomorrow' | undefined);
  if (!filePath) {
    res.status(500).send({
      code: 500,
      msg: 'something wrong'
    });
    return;
  }
  res.sendFile(filePath);
})

app.listen(process.env.EXPRESS_HTTP_PORT, () => {
  logger.info(`listening http on ${process.env.EXPRESS_HTTP_PORT}`)
})