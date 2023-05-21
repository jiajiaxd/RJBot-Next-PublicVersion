import * as fs from 'fs';
import * as path from 'path';
import {dirname} from '../app';

export function get_real_name(qq) {
    const qq_name = JSON.parse(fs.readFileSync(path.join(dirname,'config','qq_name.json'), 'utf-8'));
    if (!qq_name.hasOwnProperty(qq.toString())) {
      return false;
    } else {
      return qq_name[qq.toString()];
    }
  }