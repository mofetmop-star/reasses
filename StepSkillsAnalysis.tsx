
import React, { useState, useMemo } from 'react';
import { BloomLevel, Skill } from '../types';
import { InfoBox } from './InfoBox';

interface StepSkillsAnalysisProps {
  bloomAnalysis: {currentSkills: Skill[], suggestedSkills: Skill[]} | null;
  selectedSkills: Skill[];
  handleSkillToggle: (skill: Skill) => void;
  customSkills: Skill[];
  onAddCustomSkill: (skill: Skill) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}

const StepSkillsAnalysis: React.FC<StepSkillsAnalysisProps> = ({
  bloomAnalysis, selectedSkills, handleSkillToggle, customSkills, onAddCustomSkill, onNext, onBack, loading
}) => {
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<BloomLevel>(BloomLevel.Apply);

  const handleAdd = () => {
    if (!newSkillName.trim()) return;
    const newSkill: Skill = {
      name: newSkillName.trim(),
      bloomLevel: newSkillLevel,
      reasoning: 'הוספה ידנית על ידי המרצה'
    };
    onAddCustomSkill(newSkill);
    setNewSkillName('');
  };

  const chartData = useMemo(() => {
    if (!bloomAnalysis) return { low: 0, high: 0 };
    
    const allSkills = [...bloomAnalysis.currentSkills, ...bloomAnalysis.suggestedSkills, ...customSkills];
    const lowOrderLevels = [BloomLevel.Remember, BloomLevel.Understand];
    
    let lowCount = 0;
    let highCount = 0;

    allSkills.forEach(skill => {
        // Consider selected skills, or all if none selected yet for the overview
        if (selectedSkills.length > 0 && !selectedSkills.some(s => s.name === skill.name)) return;
        
        if (lowOrderLevels.includes(skill.bloomLevel)) {
            lowCount++;
        } else {
            highCount++;
        }
    });

    const total = lowCount + highCount;
    if (total === 0) return { low: 0, high: 0 };
    return {
        low: Math.round((lowCount / total) * 100),
        high: Math.round((highCount / total) * 100)
    };

  }, [bloomAnalysis, customSkills, selectedSkills]);

  if (!bloomAnalysis) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border animate-fade-in">
      <InfoBox title="בחירת מיומנויות יעד">
        העוזר הפדגוגי ניתח את המטלה וחילק אותה למיומנויות. <strong>סמן ב-V</strong> את המיומנויות שברצונך להעריך במטלה החדשה. תוכל גם להוסיף מיומנויות משלך בתיבה למטה.
      </InfoBox>

      {/* Bloom Taxonomy Chart */}
      <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
        <h4 className="font-bold text-gray-800 mb-4 text-center">פילוח רמות חשיבה (טקסונומיית בלום)</h4>
        <div className="flex h-12 rounded-full overflow-hidden shadow-inner">
            <div 
                style={{ width: `${chartData.low}%` }} 
                className="bg-amber-300 flex items-center justify-center text-amber-900 font-bold text-sm transition-all duration-500"
            >
                {chartData.low > 5 && `זכירה והבנה (${chartData.low}%)`}
            </div>
            <div 
                style={{ width: `${chartData.high}%` }} 
                className="bg-indigo-500 flex items-center justify-center text-white font-bold text-sm transition-all duration-500"
            >
                {chartData.high > 5 && `יישום, אנליזה ויצירה (${chartData.high}%)`}
            </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500 px-1">
             <span>רמות חשיבה בסיסיות (חשופות יותר ל-AI)</span>
             <span>רמות חשיבה גבוהות (למידה עמוקה)</span>
        </div>
      </div>
      
      <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-2 mb-6">
        {bloomAnalysis.currentSkills.concat(bloomAnalysis.suggestedSkills).concat(customSkills).map((skill, idx) => (
          <div key={idx} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${selectedSkills.some(s => s.name === skill.name) ? 'bg-indigo-50 border-indigo-400 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-80'}`}>
            <input type="checkbox" checked={selectedSkills.some(s => s.name === skill.name)} onChange={() => handleSkillToggle(skill)} className="mt-1.5 w-6 h-6 rounded-md cursor-pointer accent-indigo-600" />
            <div className="flex-1 cursor-pointer" onClick={() => handleSkillToggle(skill)}>
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-900 text-lg">{skill.name}</span>
                <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-semibold">{skill.bloomLevel}</span>
              </div>
              <p className="text-sm text-gray-700 mt-1 leading-relaxed">{skill.reasoning}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 border-dashed mb-6">
        <h4 className="font-bold text-gray-800 mb-4">הוסף מיומנות יעד נוספת</h4>
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="שם המיומנות (למשל: עבודה בצוות, פרזנטציה...)"
            className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <select 
            value={newSkillLevel}
            onChange={(e) => setNewSkillLevel(e.target.value as BloomLevel)}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            {Object.values(BloomLevel).map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          <button 
            onClick={handleAdd}
            disabled={!newSkillName.trim()}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            + הוסף מיומנות
          </button>
        </div>
      </div>

      <div className="flex gap-4 mt-8 pt-6 border-t">
        <button onClick={onBack} className="px-8 py-3 border rounded-lg font-bold hover:bg-gray-50">חזור</button>
        <button onClick={onNext} disabled={loading || selectedSkills.length === 0} className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition-all">המשך לניהול קבוצות מיומנויות</button>
      </div>
    </div>
  );
};

export default StepSkillsAnalysis;
