require('dotenv').config()
const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
const md5 = require('js-md5')
const { getlist, getVerify, create } = require('./api.js')

const TOKEN = process.env.TOKEN || null
const UID = process.env.UID || null

let message = '蒸蒸日上'+process.env.UID


if (!TOKEN || !UID) return

console.log(message)


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

const gettid = async () => {
  let res = await getlist(TOKEN)
  console.log(res)
  if (res?.code == 0) {
    const list = res.data.list
    const today = dayjs().format('YYYY.M.D')
    list.some((item) => {
      const { fid, tid, title } = item
      if (title.indexOf(today) != -1) {
        console.log('匹配标题', title)
        verifyToken({ fid, tid })
        return true
      }
      return false
    })||console.log('未找到贴子')
  }
}

const verifyToken = async ({ fid, tid }) => {
  await sleep(200)
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
  await sleep(200)
  let res = await create({ fid, tid, TOKEN, message, verify, UID })
  if (res?.code == '0') {
    console.log(res.data?.reward)
  } else {
    console.log('访问异常', res)
  }
}


gettid()
