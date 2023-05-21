import logger from './utils/logger';
import { Bot,Middleware,Message } from 'mirai-js';
import {register_anonimous} from 'NeteaseCloudMusicApi';
import FriendMessageHandler from './handler/FriendMessageHandler';
import {init} from './aichat/openai_azure';
import * as fs from 'fs';
import * as path from 'path';


logger.info('正在登录网易云API...');
register_anonimous();
logger.info('网易云登录完成.');
logger.info('正在初始化机器人...');
export let bot = new Bot();
export const dirname=__dirname;
export const jiajiaxd_api='???';
export const unm_api='???';
export const help_message = '使用帮助：\n发送"搜索 [歌曲关键词]"可开始搜索并添加音乐\n发送"列表"即可查看和编辑当前已添加音乐列表\n发送"解析 [音乐ID]即可获取指定音乐的下载链接"\n发送以"."或"。"开头的消息即可与AI对话';
if (!fs.existsSync(path.join(dirname,'data'))) {
    fs.mkdirSync(path.join(dirname,'data'));
}
init();

bot.open({
    baseUrl: 'http://127.0.0.1:8080',
    verifyKey: '???',
    qq: 3014591918
});

bot.on(['FriendMessage','StrangerMessage','TempMessage'], new Middleware().textProcessor().done(FriendMessageHandler));
bot.on('NewFriendRequestEvent', new Middleware().friendRequestProcessor().done(async event => {
    await event.agree();
    await bot.sendMessage({
        friend: event.fromId,
        message: new Message().addPlain('欢迎使用。'+help_message)
    })
}))
logger.info('初始化完毕.')
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });