import React from 'react';
import { Check, XCircle, Calculator, AlertCircle, ArrowLeft, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { STATUS_TYPES } from '../../lib/constants';

/**
 * 课程表格组件 (包含预览和最终结果两种视图)
 * @param {Object} props
 * @param {'preview' | 'result'} props.step - 当前步骤
 * @param {Array} props.data - 表格数据列表
 * @param {Function} [props.onToggleLeave] - 勾选请假回调 (index) => void
 * @param {Function} [props.onCalculate] - 点击计算回调
 * @param {Function} [props.onBack] - 点击返回回调
 * @param {Object} [props.summary] - 结果摘要 { start, end }
 */
const CourseTable = ({ 
  step, 
  data, 
  onToggleLeave, 
  onCalculate, 
  onBack, 
  summary 
}) => {
  const isPreview = step === 'preview';
  const isResult = step === 'result';

  return (
    <div className={cn(
      "bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden transition-all duration-300",
      isResult && "border-blue-200 shadow-md"
    )}>
      
      {/* --- 顶部标题栏 --- */}
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm",
            isPreview ? "bg-white border border-gray-200 text-gray-600" : "bg-green-100 text-green-700"
          )}>
            {isPreview ? '2' : '3'}
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">
              {isPreview ? '预览与请假设置' : '最终排期表'}
            </h3>
            {isPreview && (
              <p className="text-xs text-gray-500 mt-0.5">请勾选教师需要请假的日期</p>
            )}
          </div>
        </div>

        {/* 结果模式下的返回按钮 */}
        {isResult && (
          <button 
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-blue-50"
          >
            <ArrowLeft size={14} /> 返回修改
          </button>
        )}
      </div>

      {/* --- 结果模式摘要 (仅 Result 显示) --- */}
      {isResult && summary && (
        <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between text-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex gap-8">
            <div>
              <span className="text-blue-400 text-xs uppercase font-bold tracking-wider">开始日期</span>
              <div className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <Calendar size={16} className="text-blue-500"/> {summary.start}
              </div>
            </div>
            <div>
              <span className="text-blue-400 text-xs uppercase font-bold tracking-wider">结束日期</span>
              <div className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <Calendar size={16} className="text-blue-500"/> {summary.end}
              </div>
            </div>
          </div>
          <div className="text-right">
             <div className="text-xs text-blue-400 uppercase font-bold tracking-wider">总跨度</div>
             <div className="font-bold text-blue-700 text-xl">{data.length} <span className="text-sm font-normal">周</span></div>
          </div>
        </div>
      )}

      {/* --- 表格主体 (滚动区域) --- */}
      <div className="flex-1 overflow-y-auto min-h-0 p-0 custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm text-gray-500 font-medium">
            <tr>
              {/* 动态表头 */}
              {isPreview ? (
                <>
                  <th className="px-6 py-3 w-20">序号</th>
                  <th className="px-6 py-3">日期</th>
                  <th className="px-6 py-3">状态预览</th>
                  <th className="px-6 py-3 text-center w-32">教师请假</th>
                </>
              ) : (
                <>
                  <th className="px-6 py-3 w-24">堂数</th>
                  <th className="px-6 py-3">日期</th>
                  <th className="px-6 py-3 text-right">备注</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {data.map((item, idx) => {
              const isHoliday = item.status === STATUS_TYPES.HOLIDAY || item.isHoliday;
              const isLeave = item.status === STATUS_TYPES.LEAVE || item.isTeacherLeave;
              const isNormal = item.status === STATUS_TYPES.NORMAL || (!isHoliday && !isLeave);

              return (
                <tr 
                  key={item.id || idx} 
                  className={cn(
                    "group transition-colors",
                    isHoliday && "bg-red-50/60 hover:bg-red-50",
                    isLeave && "bg-yellow-50/60 hover:bg-yellow-50",
                    isNormal && "hover:bg-blue-50/50"
                  )}
                >
                  {/* 第一列：序号或堂数 */}
                  <td className="px-6 py-3">
                    {isPreview ? (
                      <span className="text-gray-400 text-xs">{idx + 1}</span>
                    ) : (
                      isNormal ? (
                        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shadow-sm">
                          {item.lessonIndex}
                        </span>
                      ) : (
                        <span className="text-gray-300 w-8 text-center inline-block">-</span>
                      )
                    )}
                  </td>

                  {/* 第二列：日期 */}
                  <td className="px-6 py-3">
                    <div className={cn("font-medium text-base", !isNormal && "text-gray-500")}>
                      {item.date}
                    </div>
                    <div className="text-xs text-gray-400">{item.weekday}</div>
                  </td>

                  {/* 第三列：预览模式-状态 | 结果模式-备注 */}
                  {isPreview ? (
                    <>
                      <td className="px-6 py-3">
                        {isHoliday ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold border border-red-200">
                            <XCircle size={12}/> 法定假跳过
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> 拟定上课
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={item.isTeacherLeave}
                          disabled={isHoliday}
                          onChange={() => onToggleLeave(idx)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                        />
                      </td>
                    </>
                  ) : (
                    <td className="px-6 py-3 text-right">
                       {isNormal && <span className="text-green-600 text-sm font-bold inline-flex items-center gap-1.5"><Check size={16} strokeWidth={3} /> 正常上课</span>}
                       {isHoliday && <span className="text-red-500 text-xs font-medium">法定假顺延</span>}
                       {isLeave && <span className="text-yellow-600 text-xs font-medium">教师请假顺延</span>}
                    </td>
                  )}
                </tr>
              );
            })}
            
            {/* 空状态处理 */}
            {data.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-gray-400 bg-gray-50/30">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle size={32} className="text-gray-300"/>
                    <span>暂无排期数据</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- 底部操作栏 (仅 Preview 显示) --- */}
      {isPreview && (
        <div className="p-4 bg-white border-t border-gray-100 flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <div className="flex-1 flex items-center text-xs text-gray-400">
            <AlertCircle size={14} className="mr-1"/> 确认无误后点击生成
          </div>
          <button 
            onClick={onCalculate}
            className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 transform active:scale-95"
          >
            <Calculator size={18} /> 
            生成最终排期
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseTable;