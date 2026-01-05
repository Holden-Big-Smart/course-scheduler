// 默认课程堂数
export const DEFAULT_SESSIONS = 8;

// 星期显示文本
export const WEEKDAY_LABELS = [
  '日', '一', '二', '三', '四', '五', '六'
];

// 状态类型枚举
export const STATUS_TYPES = {
  NORMAL: 'normal',   // 正常上课
  HOLIDAY: 'holiday', // 法定节假日
  LEAVE: 'leave'      // 教师请假
};

// 状态对应的中文描述
export const STATUS_LABELS = {
  [STATUS_TYPES.NORMAL]: '拟定上课',
  [STATUS_TYPES.HOLIDAY]: '法定假跳过',
  [STATUS_TYPES.LEAVE]: '教师请假跳过'
};