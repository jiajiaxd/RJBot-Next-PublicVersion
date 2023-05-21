import { cloudsearch, song_url } from "NeteaseCloudMusicApi";
import { Message } from "mirai-js";
import logger from "../utils/logger";
import { get_song_brief_info } from "../utils/ncm";
import { get_real_name } from "../utils/songbot";
import axios from "axios";
import { jiajiaxd_api, help_message, bot, unm_api } from "../app";
import * as aichat from "../aichat/openai_azure";

export default async function (data) {
    const sender_id = String(data['sender']['id']);
    const msg = String(data['text']);
    async function send_reply(message, receiver_id = sender_id) {
        await bot.sendMessage({
            friend: receiver_id,
            message: new Message().addText(message)
        })
        logger.info(`[MSG] ${receiver_id} <= ${message}`);
    }
    logger.info(`[MSG] ${sender_id} => ${msg}`);
    try {
        switch (true) {
            case msg.startsWith('搜索'): {
                const keyword = msg.slice(2);
                const result = (await cloudsearch({
                    keywords: keyword,
                    limit: 10,
                    offset: 0,
                    type: 1
                }))['body'];
                logger.trace(`搜索结果：${JSON.stringify(result)}`);
                let reply = '搜索结果：\n\n';
                for (let song of result.result.songs) {
                    reply += `序号:${song.id}\n${song.name} - ${song.ar.map(singer => singer.name).join('/')}\n\n`;
                }
                reply += '发送"添加 [序号]"可添加音乐到列表。\n如果你没找到你想要的音乐，请尝试输入更多关键词。如发送“搜索 稻香 周杰伦”而不是发送“搜索 稻香”。'
                await send_reply(reply);
                break;
            }
            case msg.startsWith('解析'): {
                if (msg.split(' ').length != 2) { await reply('格式错误。发送“解析 [音乐ID]”以解析音乐。'); break; }
                const id = msg.split(' ')[1];
                const song_info = await get_song_brief_info(id);
                let song_url_result = (await song_url({ id: id }))['body']['data'][0]['url'];
                if (song_url_result == null) {
                    logger.debug(`音乐${id}解析失败，尝试使用UnblockNeteaseMusic解析`);
                    song_url_result = (await axios.get(`${unm_api}/get?id=${id}`))['data']['url'];
                }
                await send_reply(`解析[${song_info['name']} - ${song_info['singer']}]结果：${song_url_result}`);
                break;
            }
            case msg.startsWith('添加'): {
                let song_id = msg.substring(2);
                let song = await get_song_brief_info(song_id);
                let adder_name = get_real_name(sender_id);
                if (!adder_name) { await send_reply('你不在高二3班师生群内，无法核验身份。请更换在高二3班师生群内的QQ与机器人互动！'); return; }
                let response = await axios.get(`${jiajiaxd_api}???/add`, { params: { song_id: song_id, qq: sender_id, adder_name: adder_name } });
                if (response.data.status === 'ok') {
                    await send_reply(`${adder_name}已添加音乐：\n\n序号:${song.id}\n${song.name} - ${song.singer}\n\n若想查看和编辑当前已添加音乐列表，请发送“列表”。`);
                } else {
                    await send_reply(`添加音乐失败。错误信息：${response.data.msg}。`);
                }
                break;
            }
            case msg.startsWith('删除'): {
                const song_id = msg.slice(2);
                const response = await axios.get(`${jiajiaxd_api}???/delete?song_id=${song_id}&qq=${sender_id}`);
                if (response.data['status'] === 'ok') {
                    const song = await get_song_brief_info(song_id);
                    await send_reply(`删除音乐[${song.name} - ${song.singer}]成功！`);
                } else {
                    await send_reply(`删除失败！错误信息：${response.data['msg']}。`);
                }
                break;
            }
            case msg === '列表': {
                let adder_name = get_real_name(sender_id);
                if (!adder_name) {
                    await send_reply('你不在高二3班师生群内，无法核验身份。请更换在???群内的QQ与机器人互动！');
                    return;
                }
                const response = await axios.get(`${jiajiaxd_api}???/list`);
                const database = response.data['data'];
                logger.trace(`服务器返回的数据库：${JSON.stringify(database)}`);
                let msg_to_send = '当前已添加音乐：\n\n';
                if (database['qq_adder'].hasOwnProperty(sender_id) === false) {
                    msg_to_send += '暂无音乐';
                    await send_reply(msg_to_send);
                    return;
                } else {
                    adder_name = database['qq_adder'][sender_id];
                }
                if (database['adder_songs'][adder_name].length !== 0) {
                    (await Promise.all(database['adder_songs'][adder_name].map(song_id => get_song_brief_info(song_id))))
                        .map(song => msg_to_send += `序号:${song['id']}\n${song['name']} - ${song['singer']} \n\n`);
                    msg_to_send += '发送"删除 [序号]"可删除列表内指定音乐';
                } else {
                    msg_to_send += '暂无音乐';
                }
                await send_reply(msg_to_send);
                break;
            }
            case msg.startsWith('.') || msg.startsWith('。'): {
                const prompt = msg.slice(1);
                let total_roles = await aichat.get_session_roles(sender_id);
                if (total_roles >= 16) {
                    await send_reply('目前最多仅支持8轮对话。请发送"清除对话"重新开始。');
                    break;
                }
                let total_token = await aichat.session_token_counter(sender_id, prompt);
                if (total_token < 7500) {
                    aichat.chat(sender_id, prompt).then(async (response) => {
                        await send_reply(response, sender_id);
                    });
                } else {
                    await send_reply('对话字数过多。请减少消息字数或发送"清除对话"重新开始。');
                }
                break;
            }
            case msg === '清除对话': {
                aichat.clear_chat(sender_id).then(async () => {
                    await send_reply('对话已清除。你可以通过输入“.”或“。”作为消息开头来和AI开始新一轮对话。', sender_id);
                });
                break;
            }
            default: {
                await send_reply('未知命令。' + help_message);
            };
        }
    }
    catch (error) {
        logger.error(error);
        send_reply(`发生错误[${error}]\n请检查命令是否输入正确。`+help_message);
    }
}