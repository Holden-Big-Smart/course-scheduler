import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, RotateCcw, Settings, XCircle, Save, Calculator } from 'lucide-react';
import YearCalendar from './components/business/YearCalendar.jsx';
import CourseTable from './components/business/CourseTable.jsx';
import { formatDate, getWeekday, isValidInteger, cn } from './lib/utils.js';
import { STATUS_TYPES } from './lib/constants.js';

const App = () => {
  // --- 状态管理 ---
  const [inputs, setInputs] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    sessions: 8
  });
  
  const [step, setStep] = useState('input'); // 'input', 'preview', 'result'
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidays, setHolidays] = useState(new Set()); // 存储 'YYYY-MM-DD' 格式的日期
  
  // 课表数据
  const [previewList, setPreviewList] = useState([]);
  const [finalList, setFinalList] = useState([]);
  const [summary, setSummary] = useState({ start: '', end: '' });

  // 输入框引用 (用于键盘导航)
  const yearRef = useRef(null);
  const monthRef = useRef(null);
  const dayRef = useRef(null);
  const sessionsRef = useRef(null);

  // --- 初始化：加载数据库中的节假日 ---
  useEffect(() => {
    const loadHolidays = async () => {
      if (window.electronAPI) {
        try {
          const savedHolidays = await window.electronAPI.getHolidays();
          setHolidays(new Set(savedHolidays));
          console.log('📚 已加载节假日库:', savedHolidays.length, '条');
        } catch (error) {
          console.error('加载数据库失败:', error);
        }
      } else {
        console.warn('⚠️ Electron API 未检测到，运行在纯浏览器模式');
      }
    };
    loadHolidays();
  }, []);

  // --- 交互逻辑 ---

  // 1. 处理输入变化
  const handleInputChange = (e, field) => {
    const value = e.target.value;
    if (value === '' || isValidInteger(value)) {
      setInputs(prev => ({ ...prev, [field]: value }));
    }
  };

  // 2. 键盘导航
  const handleKeyDown = (e, prevRef, nextRef) => {
    if (e.key === 'ArrowRight' && nextRef?.current && e.target.selectionStart === e.target.value.length) {
      e.preventDefault();
      nextRef.current.focus();
    }
    if (e.key === 'ArrowLeft' && prevRef?.current && e.target.selectionStart === 0) {
      e.preventDefault();
      prevRef.current.focus();
    }
  };

  // 3. 切换节假日 (同时更新本地 State 和数据库)
  const toggleHoliday = async (dateStr) => {
    const newHolidays = new Set(holidays);
    const isAdding = !newHolidays.has(dateStr);

    // 乐观更新 UI
    if (isAdding) {
      newHolidays.add(dateStr);
    } else {
      newHolidays.delete(dateStr);
    }
    setHolidays(newHolidays);

    // 异步写入数据库
    if (window.electronAPI) {
      try {
        if (isAdding) {
          await window.electronAPI.addHoliday(dateStr);
        } else {
          await window.electronAPI.removeHoliday(dateStr);
        }
      } catch (err) {
        console.error('数据库写入失败:', err);
        // 如果失败，应该回滚状态 (此处省略回滚逻辑)
      }
    }
  };

  // --- 核心业务算法 ---

  // 算法 A: 生成预览 (仅考虑法定节假日)
  const handlePreview = () => {
    const { year, month, day, sessions } = inputs;
    if (!year || !month || !day || !sessions) {
      alert("请填写完整的日期和堂数"); // 实际项目中建议使用 Toast
      return;
    }

    const startDate = new Date(year, month - 1, day);
    if (isNaN(startDate.getTime())) {
      alert("日期格式不正确");
      return;
    }

    let tempDates = [];
    let currentDate = new Date(startDate);
    let validSessionsCount = 0;
    const targetSessions = parseInt(sessions);
    let safetyLoop = 0; // 防止死循环

    // 逻辑：只要有效课时不够，就一直往后找
    while (validSessionsCount < targetSessions && safetyLoop < 150) {
      const dateStr = formatDate(currentDate);
      const isHoliday = holidays.has(dateStr);
      
      tempDates.push({
        id: dateStr,
        date: dateStr,
        weekday: getWeekday(currentDate),
        isHoliday: isHoliday,       // 是否是法定假
        isTeacherLeave: false,      // 预览阶段默认老师不请假
        status: isHoliday ? STATUS_TYPES.HOLIDAY : STATUS_TYPES.NORMAL,
        lessonIndex: isHoliday ? null : validSessionsCount + 1
      });

      if (!isHoliday) {
        validSessionsCount++;
      }

      // 无论如何都+7天
      currentDate.setDate(currentDate.getDate() + 7);
      safetyLoop++;
    }

    setPreviewList(tempDates);
    setStep('preview');
  };

  // 算法 B: 生成最终结果 (考虑法定假 + 教师请假)
  const handleCalculate = () => {
    // 1. 收集用户在预览表中勾选的“教师请假日期”
    const teacherLeaveSet = new Set(
      previewList.filter(item => item.isTeacherLeave).map(item => item.date)
    );

    const startDate = new Date(inputs.year, inputs.month - 1, inputs.day);
    let resultDates = [];
    let validSessionsCount = 0;
    let currentDate = new Date(startDate);
    const targetSessions = parseInt(inputs.sessions);
    let safetyLoop = 0;

    while (validSessionsCount < targetSessions && safetyLoop < 150) {
      const dateStr = formatDate(currentDate);
      const isHoliday = holidays.has(dateStr);
      const isLeave = teacherLeaveSet.has(dateStr);
      
      let status = STATUS_TYPES.NORMAL;
      if (isHoliday) status = STATUS_TYPES.HOLIDAY;
      else if (isLeave) status = STATUS_TYPES.LEAVE;

      resultDates.push({
        id: dateStr, // 必须有唯一key
        date: dateStr,
        weekday: getWeekday(currentDate),
        status: status,
        lessonIndex: status === STATUS_TYPES.NORMAL ? validSessionsCount + 1 : null
      });

      if (status === STATUS_TYPES.NORMAL) {
        validSessionsCount++;
      }

      currentDate.setDate(currentDate.getDate() + 7);
      safetyLoop++;
    }

    // 计算摘要
    const realClasses = resultDates.filter(d => d.status === STATUS_TYPES.NORMAL);
    if (realClasses.length > 0) {
      setSummary({
        start: realClasses[0].date,
        end: realClasses[realClasses.length - 1].date
      });
    }

    setFinalList(resultDates);
    setStep('result');
  };

  // 处理表格中的请假勾选
  const handleTogglePreviewLeave = (index) => {
    const newList = [...previewList];
    if (newList[index].isHoliday) return; // 节假日不能勾选请假
    newList[index].isTeacherLeave = !newList[index].isTeacherLeave;
    setPreviewList(newList);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 flex flex-col min-h-[800px]">
        
        {/* --- 顶部 Header --- */}
        <header className="bg-slate-800 p-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">课程排期助手 Pro</h1>
              <p className="text-slate-400 text-xs">自动处理节假日顺延 • 本地数据库存储</p>
            </div>
          </div>
          <button 
            onClick={() => setShowHolidayModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm transition-colors shadow-md font-medium active:scale-95"
          >
            <Settings size={16} />
            配置节假日库
          </button>
        </header>

        <main className="p-6 flex-1 flex flex-col gap-8">
          
          {/* --- 步骤 1: 输入区域 --- */}
          <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
             <div className="flex items-center gap-2 mb-6">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">1</span>
                <h2 className="text-lg font-bold text-gray-800">课程基础信息</h2>
             </div>
             
             <div className="flex flex-wrap gap-6 items-end">
                {/* 年月日输入组 */}
                <div className="flex gap-2 items-end bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="group">
                    <label className="block text-xs font-medium text-gray-500 mb-1">开始年份</label>
                    <input 
                      ref={yearRef}
                      type="text" 
                      value={inputs.year} 
                      onChange={e => handleInputChange(e, 'year')}
                      onKeyDown={e => handleKeyDown(e, null, monthRef)}
                      className="w-20 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-center font-mono text-lg" 
                      placeholder="YYYY"
                      maxLength={4}
                    />
                  </div>
                  <span className="pb-3 text-gray-400 font-light">/</span>
                  <div className="group">
                    <label className="block text-xs font-medium text-gray-500 mb-1">月</label>
                    <input 
                      ref={monthRef}
                      type="text" 
                      value={inputs.month} 
                      onChange={e => handleInputChange(e, 'month')} 
                      onKeyDown={e => handleKeyDown(e, yearRef, dayRef)}
                      className="w-16 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-center font-mono text-lg" 
                      placeholder="MM"
                      maxLength={2}
                    />
                  </div>
                   <span className="pb-3 text-gray-400 font-light">/</span>
                  <div className="group">
                    <label className="block text-xs font-medium text-gray-500 mb-1">日</label>
                    <input 
                      ref={dayRef}
                      type="text" 
                      value={inputs.day} 
                      onChange={e => handleInputChange(e, 'day')} 
                      onKeyDown={e => handleKeyDown(e, monthRef, sessionsRef)}
                      className="w-16 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-center font-mono text-lg" 
                      placeholder="DD"
                      maxLength={2}
                    />
                  </div>
                </div>

                {/* 堂数输入 */}
                <div className="group bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <label className="block text-xs font-medium text-gray-500 mb-1">课程总堂数</label>
                    <div className="relative">
                      <input 
                        ref={sessionsRef}
                        type="text" 
                        value={inputs.sessions} 
                        onChange={e => handleInputChange(e, 'sessions')} 
                        onKeyDown={e => handleKeyDown(e, dayRef, null)}
                        className="w-24 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold text-blue-600 pr-8 text-lg" 
                      />
                      <span className="absolute right-3 top-3 text-gray-400 text-xs font-bold">堂</span>
                    </div>
                </div>

                {/* 生成按钮 */}
                <div className="flex-1 text-right self-center">
                  <button 
                    onClick={handlePreview} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 inline-flex"
                  >
                    <RotateCcw size={18}/> {step === 'input' ? '生成日期预览' : '重新生成预览'}
                  </button>
                </div>
             </div>
          </section>

          {/* --- 步骤 2 & 3: 结果展示区域 --- */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-1 gap-8 min-h-0">
            {step === 'input' && (
              <div className="flex flex-col items-center justify-center h-full bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 min-h-[300px]">
                <Calculator size={48} className="mb-4 text-gray-300 opacity-50"/>
                <p className="font-medium">设置日期并点击生成预览</p>
                <p className="text-sm mt-2 opacity-60">将自动根据节假日库进行排期计算</p>
              </div>
            )}

            {step !== 'input' && (
              <CourseTable 
                step={step}
                data={step === 'preview' ? previewList : finalList}
                onToggleLeave={handleTogglePreviewLeave}
                onCalculate={handleCalculate}
                onBack={() => setStep('preview')}
                summary={summary}
              />
            )}
          </div>
        </main>

        {/* --- 节假日管理弹窗 (年视图) --- */}
        {showHolidayModal && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-gray-800 p-4 flex justify-between items-center text-white shrink-0">
                <h3 className="font-bold flex items-center gap-2"><Settings size={18}/> 节假日数据库配置</h3>
                <button 
                  onClick={() => setShowHolidayModal(false)} 
                  className="hover:bg-gray-700 p-1.5 rounded-full transition-colors text-gray-300 hover:text-white"
                >
                  <XCircle size={22}/>
                </button>
              </div>
              
              <div className="flex-1 overflow-hidden p-6 bg-gray-100 flex flex-col min-h-0">
                 <p className="text-sm text-gray-600 mb-4 bg-white p-3 rounded border border-gray-200 shadow-sm shrink-0 flex items-center gap-2">
                   <div className="w-1 h-8 bg-blue-500 rounded-full"></div>
                   <span>点击日历上的日期以<b>标记</b>或<b>取消</b>节假日。配置会自动保存到本地数据库。</span>
                 </p>
                 
                 <div className="flex-1 min-h-0">
                    <YearCalendar 
                      holidays={holidays} 
                      onToggleHoliday={toggleHoliday} 
                      initialYear={inputs.year}
                    />
                 </div>
              </div>

              <div className="p-4 bg-white border-t border-gray-200 flex justify-end shrink-0">
                 <button 
                   onClick={() => setShowHolidayModal(false)} 
                   className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm active:scale-95 transition-all"
                 >
                   <Save size={16} /> 完成配置
                 </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;