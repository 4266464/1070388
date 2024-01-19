require('dotenv').config()
const today = new Date().toLocaleDateString('zh').replaceAll('/','.')
const md5 = require('js-md5')
const { getlist, getVerify, create } = require('./api.js')

const TOKEN = process.env.TOKEN || null
const UID = process.env.UID || null

console.log(today,new Date().toLocaleTimeString('zh',{hour12:false}))
if (!TOKEN || !UID) return

let message = '蒸蒸日上'


let retryCount = 0;
const maxRetries = 20;
const retryDelay = 1000;
// If no match found, retry up to 20 times with a 1-second delay
const retry = async () => {
  retryCount++;
  await sleep(retryDelay);
  await gettid();
};

const gettid = async () => {
  let res = await getlist(TOKEN)
  console.log(res)
  if (res?.code == 0) {
    const list = res.data.list
    console.log(list.map(l=>l.title))
    if (!list.slice(0,5).some((item) => {
      const { fid, tid, title } = item
      if (retryCount < maxRetries && !title.includes(today)) { return false }
      console.log('匹配标题', title)
      verifyToken({ fid, tid })
      return true
    })) {
      if (retryCount <= maxRetries) {
        retry();
      }
    }
  } else {
    if (retryCount <= maxRetries) {
      retry();
    }
  }
}

const verifyToken = async ({ fid, tid }) => {
  await sleep(150)
  let res = await getVerify(TOKEN)
  if (res?.code == '0') {
    let safe = res.data.verify_token
    let verify = md5(message.length + safe)
    reply({ fid, tid, message, verify })
  } else {
    console.log('获取verify失败', res)
  }
}

const reply = async ({ fid, tid, message, verify }) => {
  await sleep(150)
  let res = await create({ fid, tid, TOKEN, message, verify, UID })
  if (res?.code == '0') {
    console.log(res.data?.reward)
  } else {
    console.log('访问异常', res)
  }
}


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}



const executeMainProcess = () => {
  const seconds = new Date().getSeconds();
  const minutes = new Date().getMinutes();
  if (minutes<30||seconds === 0) {
    gettid();
  } else {
    const delay = (60 - seconds) * 1001;
    console.log(`Waiting ${delay}ms until next minute`);
    setTimeout(gettid, delay);
  }
};

executeMainProcess();

executeMainProcess();
