
import React, { useState, useRef, useEffect } from 'react';
import { TaskSection, generateRubric, RubricRow } from '../services/geminiService';
import { InfoBox } from './InfoBox';

const renderMarkdown = (text: string) => {
  const cleanText = text.replace(/\*/g, ''); 
  
  let html = cleanText
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-4 mb-2 text-indigo-900">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3 text-indigo-900">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4 text-indigo-900">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/gim, '<br />');

  if (html.includes('|')) {
     html = html.replace(/\|/g, ''); 
     html = html.replace(/-{3,}/g, '');
  }
  
  return { __html: html };
};

interface SectionState extends TaskSection {
  status: 'pending' | 'approved' | 'removed';
  isEditing: boolean;
}

interface StepFinalResultProps {
  revisedSections: SectionState[];
  practicalTips: string;
  updateSectionStatus: (index: number, status: 'approved' | 'removed') => void;
  updateSectionContent: (index: number, content: string) => void;
  toggleSectionEdit: (index: number) => void;
  chatHistory: {role: 'user' | 'model', text: string}[];
  onFollowUp: (question: string) => void;
  onReset: () => void;
  onBack: () => void;
  loading: boolean;
}

const StepFinalResult: React.FC<StepFinalResultProps> = ({
  revisedSections, practicalTips, updateSectionStatus, updateSectionContent, toggleSectionEdit,
  chatHistory, onFollowUp, onReset, onBack, loading
}) => {
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Rubric State
  const [rubric, setRubric] = useState<RubricRow[] | null>(null);
  const [rubricLoading, setRubricLoading] = useState(false);
  const [isRubricEditing, setIsRubricEditing] = useState(false);
  const [rubricCopySuccess, setRubricCopySuccess] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const allSectionsHandled = revisedSections.length > 0 && revisedSections.every(s => s.status !== 'pending');
  const hasApprovedSections = revisedSections.some(s => s.status === 'approved');

  const copyAllToClipboard = () => {
    const text = revisedSections
      .filter(s => s.status === 'approved')
      .map(s => `${s.title}\n\n${s.content.replace(/\*/g, '')}`)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const copyRubricToClipboard = () => {
    if (!rubric) return;
    
    // Create a markdown table string
    const headers = '| קריטריון | מצטיין | טוב / עובר | טעון שיפור |';
    const separator = '|---|---|---|---|';
    const rows = rubric.map(row => 
      `| ${row.criterion} | ${row.excellent} | ${row.good} | ${row.needsImprovement} |`
    ).join('\n');
    
    const tableString = `${headers}\n${separator}\n${rows}`;

    navigator.clipboard.writeText(tableString).then(() => {
      setRubricCopySuccess(true);
      setTimeout(() => setRubricCopySuccess(false), 2000);
    });
  };

  const handleSendFollowUp = () => {
    if (!followUpQuestion.trim()) return;
    onFollowUp(followUpQuestion);
    setFollowUpQuestion('');
  };

  const handleGenerateRubric = async () => {
    setRubricLoading(true);
    try {
        const res = await generateRubric(revisedSections);
        setRubric(res);
    } catch (e) {
        console.error(e);
        alert('שגיאה ביצירת המחוון');
    } finally {
        setRubricLoading(false);
    }
  };

  const handleRubricChange = (index: number, field: keyof RubricRow, value: string) => {
    if (!rubric) return;
    const newRubric = [...rubric];
    newRubric[index] = { ...newRubric[index], [field]: value };
    setRubric(newRubric);
  };

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      <div className="bg-white p-10 rounded-2xl shadow-xl border-t-8 border-green-600">
        <InfoBox title="אישור ועריכת תוצרי המטלה" variant="success">
          לפניך נוסח המטלה המעודכן. <strong>עבור על כל חלק</strong>: תוכל לאשר אותו כפי שהוא, לערוך את הטקסט או להסיר חלקים שאינם רלוונטיים. בסיום, תוכל להעתיק את כל החלקים שאושרו למסמך המטלה שלך.
        </InfoBox>
        
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h3 className="text-3xl font-bold text-indigo-900">משימת הערכה</h3>
          <div className={`px-5 py-2 rounded-full font-bold text-sm border shadow-sm transition-colors ${allSectionsHandled ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
            {allSectionsHandled ? 'כל החלקים טופלו' : 'יש לאשר או לערוך את כל החלקים'}
          </div>
        </div>

        {practicalTips && (
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-10 shadow-sm">
            <h4 className="flex items-center gap-2 text-xl font-bold text-blue-900 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              סיכום האסטרטגיות שנבחרו
            </h4>
            <p className="text-blue-900/90 leading-relaxed whitespace-pre-wrap text-lg font-sans-normal">{practicalTips}</p>
          </div>
        )}

        <div className="space-y-12">
          <div>
            <h4 className="text-2xl font-bold text-indigo-700 mb-6 border-r-4 border-indigo-600 pr-4">הנחיות לסטודנטים</h4>
            <div className="space-y-6">
              {revisedSections.filter(s => s.audience === 'student').map((section, idx) => {
                const originalIdx = revisedSections.indexOf(section);
                return (
                  <div key={originalIdx} className={`p-6 rounded-2xl border-2 transition-all ${section.status === 'approved' ? 'border-green-400 bg-green-50/30' : section.status === 'removed' ? 'border-gray-200 bg-gray-50 opacity-50' : 'border-indigo-100 bg-white shadow-sm'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-xl font-bold text-indigo-900">{section.title}</h5>
                      <div className="flex gap-2">
                        <button onClick={() => updateSectionStatus(originalIdx, 'approved')} className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${section.status === 'approved' ? 'bg-green-600 text-white' : 'bg-white border text-green-600 hover:bg-green-50'}`}>אשר</button>
                        <button onClick={() => toggleSectionEdit(originalIdx)} className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${section.isEditing ? 'bg-indigo-600 text-white shadow-inner' : 'bg-white border text-indigo-600 hover:bg-indigo-50'}`}>{section.isEditing ? 'שמור' : 'ערוך'}</button>
                        <button onClick={() => updateSectionStatus(originalIdx, 'removed')} className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${section.status === 'removed' ? 'bg-red-600 text-white' : 'bg-white border text-red-600 hover:bg-red-50'}`}>הסר</button>
                      </div>
                    </div>
                    {section.isEditing ? (
                      <textarea className="w-full p-4 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 editor-textarea h-64 bg-white" value={section.content} onChange={(e) => updateSectionContent(originalIdx, e.target.value)} />
                    ) : (
                      <div className="prose prose-indigo max-w-none text-gray-800 leading-relaxed font-sans-normal whitespace-pre-wrap text-lg" dangerouslySetInnerHTML={renderMarkdown(section.content)} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-50 p-8 rounded-3xl border-2 border-dashed border-gray-300">
            <h4 className="text-2xl font-bold text-gray-700 mb-6 border-r-4 border-gray-500 pr-4">שיקולי דעת והנחיות למרצה</h4>
            <div className="space-y-6">
              {revisedSections.filter(s => s.audience === 'lecturer').map((section, idx) => {
                const originalIdx = revisedSections.indexOf(section);
                return (
                  <div key={originalIdx} className={`p-6 rounded-2xl border-2 transition-all ${section.status === 'approved' ? 'border-green-400 bg-green-50/20' : section.status === 'removed' ? 'border-gray-200 bg-gray-50 opacity-50' : 'border-gray-200 bg-white'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-xl font-bold text-gray-800">{section.title}</h5>
                      <div className="flex gap-2">
                        <button onClick={() => updateSectionStatus(originalIdx, 'approved')} className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${section.status === 'approved' ? 'bg-green-600 text-white' : 'bg-white border text-green-600 hover:bg-green-50'}`}>אשר</button>
                        <button onClick={() => toggleSectionEdit(originalIdx)} className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${section.isEditing ? 'bg-indigo-600 text-white shadow-inner' : 'bg-white border text-indigo-600 hover:bg-indigo-50'}`}>{section.isEditing ? 'שמור' : 'ערוך'}</button>
                        <button onClick={() => updateSectionStatus(originalIdx, 'removed')} className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${section.status === 'removed' ? 'bg-red-600 text-white' : 'bg-white border text-red-600 hover:bg-red-50'}`}>הסר</button>
                      </div>
                    </div>
                    {section.isEditing ? (
                      <textarea className="w-full p-4 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 editor-textarea h-64 bg-white" value={section.content} onChange={(e) => updateSectionContent(originalIdx, e.target.value)} />
                    ) : (
                      <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed font-sans-normal whitespace-pre-wrap text-lg opacity-90 italic" dangerouslySetInnerHTML={renderMarkdown(section.content)} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Rubric Generator Section */}
        <div className="mt-10 border-t pt-8">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-2xl font-bold text-indigo-900">מחוון הערכה (Rubric)</h4>
                {!rubric && (
                    <button 
                        onClick={handleGenerateRubric} 
                        disabled={rubricLoading}
                        className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-6 py-2 rounded-xl font-bold hover:bg-indigo-100 transition-all shadow-sm"
                    >
                        {rubricLoading ? 'מייצר מחוון...' : '✨ צור מחוון הערכה למטלה'}
                    </button>
                )}
            </div>
            {rubric && (
                 <div className="bg-white p-6 rounded-2xl border-2 border-indigo-100 shadow-sm animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-sm text-gray-500 italic">ניתן לערוך את הטבלה ע"י לחיצה על "ערוך"</div>
                        <div className="flex gap-2">
                           <button onClick={() => setIsRubricEditing(!isRubricEditing)} className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${isRubricEditing ? 'bg-indigo-600 text-white shadow-inner' : 'bg-white border text-indigo-600 hover:bg-indigo-50'}`}>
                             {isRubricEditing ? 'שמור שינויים' : 'ערוך טבלה'}
                           </button>
                           <button onClick={copyRubricToClipboard} className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all border ${rubricCopySuccess ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                             {rubricCopySuccess ? 'הועתק!' : 'העתק מחוון'}
                           </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-indigo-50 text-indigo-900">
                            <th className="p-3 border border-indigo-100 w-1/4">קריטריון</th>
                            <th className="p-3 border border-indigo-100 w-1/4">מצטיין</th>
                            <th className="p-3 border border-indigo-100 w-1/4">טוב / עובר</th>
                            <th className="p-3 border border-indigo-100 w-1/4">טעון שיפור</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rubric.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="p-3 border border-gray-200 align-top font-bold text-gray-800">
                                {isRubricEditing ? <textarea value={row.criterion} onChange={(e) => handleRubricChange(idx, 'criterion', e.target.value)} className="w-full h-full p-2 border rounded bg-white text-sm" rows={3} /> : row.criterion}
                              </td>
                              <td className="p-3 border border-gray-200 align-top text-gray-700 text-sm">
                                {isRubricEditing ? <textarea value={row.excellent} onChange={(e) => handleRubricChange(idx, 'excellent', e.target.value)} className="w-full h-full p-2 border rounded bg-white text-sm" rows={4} /> : row.excellent}
                              </td>
                              <td className="p-3 border border-gray-200 align-top text-gray-700 text-sm">
                                {isRubricEditing ? <textarea value={row.good} onChange={(e) => handleRubricChange(idx, 'good', e.target.value)} className="w-full h-full p-2 border rounded bg-white text-sm" rows={4} /> : row.good}
                              </td>
                              <td className="p-3 border border-gray-200 align-top text-gray-700 text-sm">
                                {isRubricEditing ? <textarea value={row.needsImprovement} onChange={(e) => handleRubricChange(idx, 'needsImprovement', e.target.value)} className="w-full h-full p-2 border rounded bg-white text-sm" rows={4} /> : row.needsImprovement}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
            )}
        </div>

        <div className="mt-12 pt-8 border-t flex flex-wrap gap-4">
          <button onClick={copyAllToClipboard} disabled={!hasApprovedSections} className={`flex-1 py-4 rounded-xl font-bold border-2 transition-all ${copySuccess ? 'bg-green-600 text-white border-green-600' : 'border-indigo-600 text-indigo-600 hover:bg-indigo-50 shadow-md'}`}>
            {copySuccess ? 'הטקסט הועתק!' : 'העתק את כל חלקי המטלה שאושרו'}
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-200 hide-on-print">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-800"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>דיוק והתייעצות נוספת</h3>
        <div className="max-h-80 overflow-y-auto mb-6 space-y-4 p-5 bg-gray-50 rounded-xl border shadow-inner">
          {chatHistory.length === 0 && <p className="text-gray-400 text-center italic py-4">שאל שאלות נוספות לדיוק המטלה...</p>}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-900 border border-indigo-200' : 'bg-white text-gray-800 border border-gray-200'}`}>{msg.text}</div></div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-2">
          <input type="text" value={followUpQuestion} onChange={(e) => setFollowUpQuestion(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendFollowUp()} placeholder="שאל שאלה נוספת..." className="flex-1 p-4 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" />
          <button onClick={handleSendFollowUp} disabled={loading} className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all">שלח</button>
        </div>
      </div>
      <div className="flex gap-4 hide-on-print">
        <button onClick={onBack} className="px-10 py-4 border-2 rounded-xl font-bold hover:bg-gray-100 transition-all">חזור</button>
        <button onClick={onReset} className="flex-1 bg-indigo-900 text-white py-4 rounded-xl font-bold hover:bg-black shadow-lg transition-all">סיים וחזור לדף הבית</button>
      </div>
    </div>
  );
};

export default StepFinalResult;
