import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, cn } from '../../lib/utils';
import { WEEKDAY_LABELS } from '../../lib/constants';

/**
 * 年视图日历组件
 * @param {Object} props
 * @param {Set<string>} props.holidays - 节假日集合 (Set of 'YYYY-MM-DD')
 * @param {Function} props.onToggleHoliday - 点击日期回调 (dateStr) => void
 * @param {number} [props.initialYear] - 初始年份
 */
const YearCalendar = ({ holidays, onToggleHoliday, initialYear }) => {
  const [viewYear, setViewYear] = useState(initialYear || new Date().getFullYear());
  
  // 生成 0-11 的数组，代表12个月
  const months = Array.from({ length: 12 }, (_, i) => i);

  // 渲染单个月份的小日历
  const renderMonth = (monthIndex) => {
    const daysInMonth = new Date(viewYear, monthIndex + 1, 0).getDate(); // 获取该月总天数
    const firstDayWeekday = new Date(viewYear, monthIndex, 1).getDay(); // 获取该月1号是周几
    
    const days = [];
    
    // 1. 填充月初的空白占位
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="h-6"></div>);
    }
    
    // 2. 填充日期按钮
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(new Date(viewYear, monthIndex, d));
      const isHoliday = holidays.has(dateStr);
      
      days.push(
        <button
          key={dateStr}
          onClick={() => onToggleHoliday(dateStr)}
          className={cn(
            "h-6 w-full flex items-center justify-center text-[10px] font-medium rounded transition-all duration-200",
            // 节假日样式
            isHoliday 
              ? "bg-red-500 text-white shadow-sm hover:bg-red-600 active:scale-95" 
              : "text-gray-700 hover:bg-blue-100 active:bg-blue-200"
          )}
          title={isHoliday ? "点击取消节假日" : "点击设为节假日"}
        >
          {d}
        </button>
      );
    }

    return (
      <div key={monthIndex} className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
        {/* 月份标题 */}
        <div className="text-center font-bold text-gray-800 text-sm mb-2 bg-gray-50 rounded py-1 border-b border-gray-100">
          {monthIndex + 1}月
        </div>
        
        {/* 星期表头 */}
        <div className="grid grid-cols-7 gap-px text-center mb-1">
           {WEEKDAY_LABELS.map(d => (
             <div key={d} className="text-[10px] text-gray-400 font-medium">{d}</div>
           ))}
        </div>
        
        {/* 日期网格 */}
        <div className="grid grid-cols-7 gap-y-1 gap-x-0.5">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 h-full flex flex-col">
      {/* 顶部控制栏 */}
      <div className="flex justify-center items-center gap-6 mb-4 shrink-0">
        <button 
          onClick={() => setViewYear(y => y - 1)} 
          className="p-1.5 hover:bg-white hover:shadow text-gray-600 rounded-full transition-all active:scale-90"
          title="上一年"
        >
          <ChevronLeft size={20} />
        </button>
        
        <span className="text-xl font-bold text-gray-800 tracking-widest font-mono">
          {viewYear}年
        </span>
        
        <button 
          onClick={() => setViewYear(y => y + 1)} 
          className="p-1.5 hover:bg-white hover:shadow text-gray-600 rounded-full transition-all active:scale-90"
          title="下一年"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      
      {/* 日历主体 (滚动区域) */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
          {months.map(m => renderMonth(m))}
        </div>
      </div>
      
      {/* 底部图例 */}
      <div className="mt-4 pt-3 border-t border-gray-200 flex gap-6 justify-center text-xs text-gray-500 shrink-0">
         <div className="flex items-center gap-2">
           <div className="w-4 h-4 bg-red-500 rounded shadow-sm"></div> 
           <span>节假日 (点击切换)</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div> 
           <span>正常工作日</span>
         </div>
      </div>
    </div>
  );
};

export default YearCalendar;