import { Configuration, OpenAIApi } from "azure-openai";
import * as fs from "fs";
import * as path from 'path';
import { dirname } from '../app';
import logger from "../utils/logger";
import {encode} from "gpt-3-encoder";

const configuration = new Configuration({
    azure: {
        endpoint: '???',
        apiKey: '???',
    }
});
const openai = new OpenAIApi(configuration);
export function init(){
    if (!fs.existsSync(path.join(dirname, 'data', 'openai_chat_history.json'))) {
        fs.writeFileSync(path.join(dirname, 'data', 'openai_chat_history.json'), JSON.stringify({}));
    }
}

export async function chat(session_name, msg) {
    return new Promise(async (resolve, reject) => {
        fs.readFile(path.join(dirname, 'data', 'openai_chat_history.json'), (err, data) => {
            if (err) throw err;
            let chat_history = JSON.parse(data);
            if (!chat_history.hasOwnProperty(session_name)) {
                chat_history[session_name] = [];
            }
            chat_history[session_name].push({ "role": "user", "content": msg });
            const completion = openai.createChatCompletion({
                model: "gpt3-5",
                messages: chat_history[session_name],
            });
            completion.then((result) => {
                const generated = result['data']['choices'][0]['message']['content'];
                chat_history[session_name].push({ "role": "assistant", "content": generated });
                fs.writeFile(path.join(dirname, 'data', 'openai_chat_history.json'), JSON.stringify(chat_history), (err) => {
                    if (err) throw err;
                });
                resolve(generated);
            });
        }
        ); 
    });
}

export async function clear_chat(session_to_be_cleared){
    return new Promise(async (resolve,reject)=>{
        fs.readFile(path.join(dirname, 'data', 'openai_chat_history.json'), (err, data) => {
            if (err) throw err;
            let chat_history = JSON.parse(data);
            if (chat_history.hasOwnProperty(session_to_be_cleared)){
                delete chat_history[session_to_be_cleared];
            }
            fs.writeFile(path.join(dirname, 'data', 'openai_chat_history.json'), JSON.stringify(chat_history), (err) => {
                if (err) throw err;
            });
            resolve();
        });
    });
}

export function str_token_counter(str_to_count){
    return encode(str_to_count).length;
}

export async function session_token_counter(session_to_be_counted,extra_str=''){
    return new Promise(async (resolve,reject)=>{
        fs.readFile(path.join(dirname, 'data', 'openai_chat_history.json'), (err, data) => {
            if (err) throw err;
            let chat_history = JSON.parse(data);
            if (!chat_history.hasOwnProperty(session_to_be_counted)) {
                resolve(str_token_counter(extra_str));
            }else{
                let token_count=0;
                for (let msg of chat_history[session_to_be_counted]){
                    token_count+=str_token_counter(msg['content']);
                }
                resolve(token_count);
            }
        });
    });
}

export async function get_session_roles(session_name){
    return new Promise(async (resolve,reject)=>{
        fs.readFile(path.join(dirname, 'data', 'openai_chat_history.json'), (err, data) => {
            if (err) throw err;
            let chat_history = JSON.parse(data);
            if (!chat_history.hasOwnProperty(session_name)) {
                resolve(0);
            }else{
                resolve(chat_history[session_name].length);
            }
        });
    });
}