import { song_detail } from "NeteaseCloudMusicApi";
import logger from "./logger";

export async function get_song_brief_info(id){
  logger.debug(`正在检索歌曲ID：${id}`);
  const got_song_detail = (await song_detail({ids: String(id)}))['body'];
  logger.trace(`歌曲信息：${JSON.stringify(got_song_detail)}`);
  let return_json={};
  return_json['id']=got_song_detail.songs[0].id;
  return_json['name']=got_song_detail.songs[0].name;
  return_json['singer']=got_song_detail.songs[0].ar.map(singer => singer.name).join('/');
  return return_json;
}