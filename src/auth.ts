import { existsSync, readFileSync, writeFileSync } from "fs";
import axiosInstance from "./utils/axiosInstance";
import logger from "./utils/logger"
import path from "path";
import { getVerifyCodeContent } from "./utils/ocr";
import QueryString from "qs";
import { terminal } from "terminal-kit";
import sharp from "sharp";
import { chromium } from "playwright";
import { delay } from "./utils/utils";

export const genNewCookie = async () => {
  logger.info('generating new cookie');
  const resp = await axiosInstance('/', {
    headers: {
      'Cookie': ''
    }
  })
  const newCookie = resp.headers['set-cookie'];
  if (newCookie) {
    logger.info('generated new cookie succeed')
    const cookieString = newCookie.map(cookie => {
      // 提取 cookie 的键值对部分，去掉其他属性（如 Path, HttpOnly 等）
      return cookie.split(';')[0];
    }).join('; ');
    axiosInstance.defaults.headers['Cookie'] = cookieString;
    const dataPath = path.join('data', 'data.json');
    if (existsSync(dataPath)) {
      const raw = JSON.parse(readFileSync(dataPath, { encoding: 'utf-8' }));
      writeFileSync(dataPath, JSON.stringify({
        ...raw,
        cookie: cookieString
      }, null, 2))
    }
  } else {
    logger.error('generated new cookie failed');
  }
  return;
}

export const getVerifyCode = async (Cookie?: string) => {
  logger.info('requesting new verify code');
  const resp = await axiosInstance('/jsxsd/verifycode.servlet', {
    responseType: 'arraybuffer',
    headers: {
      Cookie
    }
  })
  const filePath = path.join('temp', `verify-code-${+new Date()}.jpeg`);
  // writeFileSync(filePath, resp.data);
  await sharp(resp.data)
    .grayscale() // 转换为灰度图
    .toFile(filePath); // 保存处理后的图像

  return filePath;
  // return `data:${resp.headers['content-type']};base64,${Buffer.from(resp.data, 'binary').toString('base64')}`;
  // return Buffer.from(resp.data, 'binary').toString('base64');
}

export const getVerifyCodeContentManually = async (data: string) => {
  await terminal.drawImage(data);
}

export const getFlag = async () => {
  const result = (await axiosInstance('/Logon.do?method=logon&flag=sess').then((data) => data.data)).split('#');
  return {
    scode: result[0],
    sxh: result[1]
  };
}

export const login = async () => {
  logger.info('loging in');

  await genNewCookie();

  const verifyCodePath = await getVerifyCode();

  const codeContent = await getVerifyCodeContent(verifyCodePath);
  // const code = await getVerifyCodeContentManually(verifyCodePath);
  // const code = await getVerifyCodeContentManually(`${process.env.BASE_URL}/jsxsd/verifycode.servlet`);

  const code = process.env.ID + "%%%" + process.env.PASSWORD;
  let encoded = "";
  let { scode, sxh } = await getFlag();
  for (let i = 0; i < code.length; i++) {
    if (i < 20) {
      encoded = encoded + code.substring(i, i + 1) + scode.substring(0, parseInt(sxh.substring(i, i + 1)));
      scode = scode.substring(parseInt(sxh.substring(i, i + 1)), scode.length);
    } else {
      encoded = encoded + code.substring(i, code.length);
      i = code.length;
    }
  }

  // const encoded = Buffer.from(process.env.ID as string, 'utf-8').toString('base64')
  //   + '%%%'
  //   + Buffer.from(process.env.PASSWORD as string, 'utf-8').toString('base64');

  console.log(encoded);

  const resp = await axiosInstance('/Logon.do?method=logon', {
    method: 'post',
    maxRedirects: 1,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: QueryString.stringify({
      userAccount: '',
      userPassword: '',
      RANDOMCODE: codeContent,
      encoded
    })
  })
    .then((resp) => {
      console.log(resp)
      return resp;
    })
    .catch(error => {
      if (error.response) {
        return error.response
      }
    });

  const cookieString = (resp.headers['set-cookie'] as (string[] | undefined) ?? []).map(cookie => {
    // 提取 cookie 的键值对部分，去掉其他属性（如 Path, HttpOnly 等）
    return cookie.split(';')[0];
  }).join('; ');
  const dataPath = path.join('data', 'data.json');
  const raw = JSON.parse(readFileSync(dataPath, { encoding: 'utf-8' }));
  const cookie = (raw.cookie || '') + cookieString;
  writeFileSync(dataPath, JSON.stringify({
    ...raw,
    cookie
  }, null, 2))
  axiosInstance.defaults.headers['Cookie'] = cookie;

  if (resp.status === 302) {
    logger.info('log in succeed')
  } else {
    logger.error('log in failed')
    console.log(resp.status);
    console.log(resp.headers)
  }
  return;
}

export const loginViaPlaywright = async () => {
  logger.info('logging in via playwright');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // 打开网页
  await page.goto('http://61.182.88.214:8090/');

  const filePath = path.join('temp', `verify-code-${+new Date()}.jpeg`);

  const codeElement = await page.$('img#SafeCodeImg');
  const codeBuffer = await codeElement?.screenshot();
  await sharp(codeBuffer)
    .grayscale() // 转换为灰度图
    .toFile(filePath); // 保存处理后的图像

  const verifyCode = await getVerifyCodeContent(filePath);

  // 选择输入框并输入内容
  await page.fill('input#userAccount', process.env.ID || '');
  await page.fill('input#userPassword', process.env.PASSWORD || '');
  await page.fill('input#RANDOMCODE', verifyCode || '');

  await page.click('button.login_btn');

  await delay(1000);

  logger.info(`current url: ${page.url()}`);

  if (page.url() == 'http://61.182.88.214:8090/jsxsd/framework/xsMain.jsp') {
    const nameElement = await page.$('#btn_gotoGrzx > .glyphicon-class');
    const name = await nameElement?.innerText() || 'unknown';
    logger.info('log in succeed as ' + name);
    const cookies = await context.cookies();
    const cookiesString = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join(';');
    axiosInstance.defaults.headers['Cookie'] = cookiesString;
    const dataPath = path.join('data', 'data.json');
    if (existsSync(dataPath)) {
      const raw = JSON.parse(readFileSync(dataPath, { encoding: 'utf-8' }));
      writeFileSync(dataPath, JSON.stringify({
        ...raw,
        cookie: cookiesString
      }, null, 2))
    }
    await browser.close();
    return true;
  } else {
    logger.error('log in failed');
    await browser.close();
    return false;
  }
}

export const loginViaPlaywrightAuto = async (maxRetries: number = 5, delayMs: number = 3000): Promise<boolean> => {
  logger.info('trying to auto log in');

  let attempt = 0;

  while (attempt < maxRetries) {
    const result = await loginViaPlaywright(); // 调用 login 函数
    if (result) {
      return true;
    }

    attempt++;
    logger.error(`log in failed. try ${attempt} times. retry after ${delayMs / 1000}s...`)

    await delay(delayMs);
  }

  return false;
}