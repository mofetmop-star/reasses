
import React, { useState } from 'react';
import { AssessmentMethod } from '../types';
import { InfoBox } from './InfoBox';

const CATEGORIZED_OPTIONS = {
  FaceToFace: [
    'מבחן כתוב בכיתה',
    'בוחן ממוחשב קצר בכיתה',
    'בחינה אישית בע"פ',
    'שאלות ידע מהירות בשיעור',
    'הצגת תוצר קבוצתי',
    'הערכת דיון קבוצתי',
    'כתיבה והגשת עבודה בכיתה',
    'הערכה מדגמית'
  ],
  Submission: [
    'כתיבת משימה עם AI',
    'משוב על תוצר AI',
    'הערכת עמיתים',
    'הערכה עצמית',
    'סימולציה שפותחה עם AI',
    'יומן רפלקציה',
    'תיעוד שלבי העבודה'
  ],
  Defense: [
    'בחינה אישית בע"פ',
    'הערכה מדגמית',
    'שאלות לקבוצת המגישים בכיתה'
  ]
};

interface StepStrategyBuilderProps {
  strategies: AssessmentMethod[];
  numStudents: number;
  updateStrategySelection: (index: number, category: 'FaceToFace' | 'Submission', method?: string) => void;
  moveSkillToGroup: (skillName: string, targetGroupId: string) => void;
  addNewGroup: (skillName: string, isDefense?: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}

const StepStrategyBuilder: React.FC<StepStrategyBuilderProps> = ({
  strategies, numStudents, updateStrategySelection, moveSkillToGroup, addNewGroup, onNext, onBack, loading
}) => {
  const [inspectedSkill, setInspectedSkill] = useState<{name: string, groupIdx: number} | null>(null);

  const shouldShowDefenseSuggestion = (idx: number, strat: AssessmentMethod) => {
    // Show defense suggestion if this is the last item and it is a submission
    const isLast = idx === strategies.length - 1;
    const isAiSubmission = strat.userSelectedCategory === 'Submission';
    const hasRoomForMore = strategies.length < 3;
    return isLast && isAiSubmission && hasRoomForMore;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white p-8 rounded-2xl shadow-xl border-t-8 border-indigo-600 relative">
        <InfoBox title="בניית תהליך ההערכה">
          לפניך הצעה לרצף הערכה המותאם למיומנויות שבחרת.
          העוזר הפדגוגי סידר את החלקים בסדר לוגי (למשל: ידע לפני יישום, או יצירה לפני הגנה), אך יש לך שליטה מלאה לשנות את השיטות והסדר.
        </InfoBox>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-indigo-900">רצף ההערכה המוצע</h3>
            <p className="text-gray-600">התאם את הקבוצות לפי שיקול דעתך. העוזר מתחשב ב-{numStudents} סטודנטים.</p>
          </div>
          <button onClick={() => addNewGroup('מיומנות חדשה')} className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-700 transition-all shadow-md">+ הוסף חלק</button>
        </div>
        <div className="space-y-8">
          {strategies.map((strat, idx) => (
            <div key={strat.id} className="p-6 rounded-2xl bg-gray-50 border-2 border-indigo-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-800 px-4 py-1 rounded-bl-xl font-bold text-sm">
                 חלק {idx + 1} בתהליך
              </div>
              <h4 className="text-sm font-bold text-indigo-400 mb-3 mt-4 uppercase">קבוצת מיומנויות</h4>
              <div className="flex flex-wrap gap-3 mb-6">
                {strat.skills.map((s, i) => (
                  <button key={i} onClick={() => setInspectedSkill({name: s, groupIdx: idx})} className={`skill-btn flex items-center bg-white text-indigo-900 border-2 border-indigo-200 text-sm px-4 py-2 rounded-xl font-bold shadow-sm ${inspectedSkill?.name === s ? 'ring-4 ring-indigo-400' : ''}`}>{s}</button>
                ))}
              </div>
              {inspectedSkill && inspectedSkill.groupIdx === idx && (
                <div className="mb-6 p-5 bg-white rounded-xl border-2 border-indigo-500 shadow-lg animate-fade-in">
                  <div className="flex justify-between items-start mb-4">
                    <h5 className="font-bold text-lg text-indigo-900">{inspectedSkill.name}</h5>
                    <button onClick={() => setInspectedSkill(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <span className="text-xs font-bold text-gray-400 w-full mb-1">העבר לחלק:</span>
                    {strategies.map((target, tIdx) => target.id !== strat.id && <button key={target.id} onClick={() => { moveSkillToGroup(inspectedSkill.name, target.id); setInspectedSkill(null); }} className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white">חלק {tIdx + 1}</button>)}
                    <button onClick={() => { addNewGroup(inspectedSkill.name); setInspectedSkill(null); }} className="bg-green-50 text-green-700 text-xs px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white">+ חלק חדש</button>
                  </div>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-8 pt-4 border-t">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">סוג הערכה:</label>
                  <div className="flex gap-4">
                    <button onClick={() => updateStrategySelection(idx, 'FaceToFace')} className={`flex-1 py-4 rounded-xl font-bold border-2 transition-all ${strat.userSelectedCategory === 'FaceToFace' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-200'}`}>הערכה בסביבה מבוקרת</button>
                    <button onClick={() => updateStrategySelection(idx, 'Submission')} className={`flex-1 py-4 rounded-xl font-bold border-2 transition-all ${strat.userSelectedCategory === 'Submission' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-200'}`}>הערכה בסביבה פתוחה</button>
                  </div>
                </div>
                {strat.userSelectedCategory && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-bold text-gray-700 mb-3">בחירת שיטה:</label>
                    <select 
                      value={strat.userSelectedMethod} 
                      onChange={(e) => updateStrategySelection(idx, strat.userSelectedCategory!, e.target.value)} 
                      className="w-full p-4 border-2 border-indigo-200 rounded-xl bg-white outline-none focus:border-indigo-500 font-medium text-gray-800 shadow-sm appearance-none"
                    >
                      <option value="">-- בחר שיטה --</option>
                      {(() => {
                        const baseOptions = CATEGORIZED_OPTIONS[strat.userSelectedCategory];
                        const defenseOptions = strat.userSelectedCategory === 'FaceToFace' ? CATEGORIZED_OPTIONS.Defense : [];
                        const combined = Array.from(new Set([...baseOptions, ...defenseOptions]));
                        return combined.map(opt => (
                          <option key={opt} value={opt}>
                            {opt === strat.method ? `${opt} (מומלץ)` : opt}
                          </option>
                        ));
                      })()}
                    </select>
                    <div className="mt-3 bg-blue-50 border border-blue-100 p-3 rounded-lg">
                        <p className="text-xs font-bold text-blue-800 mb-1">רציונל פדגוגי לשיטה ולמיקום ברצף:</p>
                        <p className="text-sm text-blue-900 leading-relaxed">{strat.explanation}</p>
                    </div>
                    {shouldShowDefenseSuggestion(idx, strat) && (
                      <button onClick={() => addNewGroup('כללי', true)} className="mt-3 w-full text-xs bg-amber-50 text-amber-700 border border-amber-200 p-2 rounded-lg font-bold hover:bg-amber-100 shadow-sm transition-colors">+ הצעה: הוספת שלב הגנה (Defense) בסיום התהליך</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-12 pt-8 border-t">
          <button onClick={onBack} className="px-10 py-4 border-2 rounded-xl font-bold hover:bg-gray-50 transition-all">חזור</button>
          <button onClick={onNext} disabled={loading} className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold text-xl shadow-xl hover:bg-green-700 transition-all">צור מטלה וסיכום למידה</button>
        </div>
      </div>
    </div>
  );
};

export default StepStrategyBuilder;
