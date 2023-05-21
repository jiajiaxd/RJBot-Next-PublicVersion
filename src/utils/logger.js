import log4js from "log4js";
import moment from "moment";

const startTime = moment().format('YYYY-MM-DD HH:mm:ss');

log4js.configure({
  appenders: {
    file: {
      type: 'file',
      filename: `./logs/${startTime}.log`,
      layout: {
        type: 'pattern',
        pattern: '[%d{yyyy-MM-dd hh:mm:ss}] [%p] - %m',
      },
    },
    console: {
      type: 'console',
      layout: {
        type: 'pattern',
        pattern: '%[[%d{yyyy-MM-dd hh:mm:ss}] [%p] -% %m',
      },
    },
  },
  categories: {
    default: {
      appenders: ['file', 'console'],
      level: 'debug',
    },
  },
  pm2: true,
  disableClustering: true,
  colors: { // 添加颜色配置
    debug: 'blue',
    info: 'green',
    warn: 'yellow',
    error: 'red',
  },
});

const logger = log4js.getLogger();
export default logger;