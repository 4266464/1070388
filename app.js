const today = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Shanghai', year: 'numeric', month: 'numeric', day: 'numeric' }).replace(/([0-9]+)\/([0-9]+)\/([0-9]+)/, (s,m,d,y)=>`${y}.${m}.${d}`)
const md5 = require('js-md5')
const { getlist, getVerify, create } = require('./api.js')

const TOKEN = process.env.TOKEN || null
const UID = process.env.UID || null

console.log(today)
if (!TOKEN || !UID) return

let message = '蒸蒸日上'


let retryCount = 0;
const maxRetries = 20;
const retryDelay = 1000;

const gettid = async () => {
  let res = await getlist(TOKEN)
  if (res?.code == 0) {
    const list = res.data.list
    if (!list.some((item) => {
      const { fid, tid, title } = item
      if (title.indexOf(today) != -1) {
        console.log('匹配标题', title)
        verifyToken({ fid, tid })
        return true
      }
      return false
    })) {
      // If no match found, retry up to 20 times with a 1-second delay
      const retry = async () => {
        await sleep(retryDelay);
        retryCount++;
        if (retryCount <= maxRetries) {
          await gettid();
        }
      };
      retry();
    }
  } else {
    // Retry if res.code is not 0
    const retry = async () => {
      await sleep(retryDelay);
      retryCount++;
      if (retryCount <= maxRetries) {
        await gettid();
      }
    };
    retry();
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
  if (seconds === 0) {
    gettid();
  } else {
    const delay = (60 - seconds) * 1000;
    setTimeout(executeMainProcess, delay);
  }
};

executeMainProcess();
