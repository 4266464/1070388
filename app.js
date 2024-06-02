require('dotenv').config()
const today = new Date().toLocaleDateString('zh', { timeZone: 'Asia/Shanghai' }).replaceAll('/', '.')
const md5 = require('js-md5')
const { getlist, getVerify, create } = require('./api.js')
const { email } = require('./mail.js');


const TOKEN = process.env.TOKEN || null
const UID = process.env.UID || null
const MAIL = process.env.MAIL || null
const KEY = process.env.KEY || null

console.log(today, new Date().toLocaleTimeString('zh', { hour12: false, timeZone: 'Asia/Shanghai' }))
if (!TOKEN || !UID) return

let message = '蒸蒸日上'
var alt = false

var retryCount = 0;
const maxRetries = 20;
const retryDelay = 300;
// If no match found, retry up to 20 times with a 1-second delay
const retry = async () => {
	retryCount++;
	if(retryCount>=maxRetries){
		email('三国杀社区签到','签到失败',MAIL,KEY);
		return;
	}
	await sleep(retryDelay);
	await gettid();
};

const gettid = async () => {
	console.log('开始获取', new Date().toLocaleTimeString('zh', { hour12: false, timeZone: 'Asia/Shanghai' }) + '.' + String(new Date().getMilliseconds()).padStart(3, '0'))
	let res = await getlist(TOKEN, alt)
	console.log('获取成功', new Date().toLocaleTimeString('zh', { hour12: false, timeZone: 'Asia/Shanghai' }) + '.' + String(new Date().getMilliseconds()).padStart(3, '0'))
	if (res?.code !== 0 || !res?.data?.list?.length) alt = true;
	if (res?.code == 0) {
		const list = res.data.list.slice(0, alt ? 20 : 5)
		console.log(list.map(l => l.title))
		if (!list.some((item) => {
			const { fid, tid, title } = item
			if (retryCount < maxRetries && !title.includes(today) && !title.includes('【签到')) { return false }
			console.log('匹配标题', title)
			verifyToken({ fid, tid })
			return true
		})) {
			if (retryCount < maxRetries) {
				retry();
			}
		}
	} else {
		if (retryCount < maxRetries) {
			retry();
		}
	}
}

const verifyToken = async ({ fid, tid }) => {
	await sleep(100)
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
	await sleep(100)
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
	let [hour, minute, second] = new Date().toLocaleTimeString('zh', { hour12: false, timeZone: 'Asia/Shanghai' }).split(':');
	let delay = (((8 - hour) * 60 + 59 - minute) * 60 + 59 - second) * 1000 - 500
	console.log(`Waiting ${delay/1000}s until next minute`);
	if (delay < 0) {
		gettid();
	} else {
		setTimeout(gettid, delay);
	}
};

executeMainProcess();
