
import React, { useState } from 'react';
import Layout from './components/Layout';
import { InfoBox } from './components/InfoBox';
import StepInput from './components/StepInput';
import StepSkillsAnalysis from './components/StepSkillsAnalysis';
import StepStrategyBuilder from './components/StepStrategyBuilder';
import StepFinalResult from './components/StepFinalResult';
import Stepper from './components/Stepper';
import { AppMode, BloomLevel, Skill, AssessmentMethod } from './types';
import { 
  analyzeBloomTaxonomy, 
  generateAssessmentStrategies, 
  rephraseAssignment, 
  askFollowUpQuestion,
  TaskSection
} from './services/geminiService';

interface SectionState extends TaskSection {
  status: 'pending' | 'approved' | 'removed';
  isEditing: boolean;
}

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('HOME');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(1);
  const [assignmentText, setAssignmentText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string, data: string, mimeType: string } | null>(null);
  const [numStudents, setNumStudents] = useState<number>(30);
  const [bloomAnalysis, setBloomAnalysis] = useState<{currentSkills: Skill[], suggestedSkills: Skill[]} | null>(null);
  const [customSkills, setCustomSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [strategies, setStrategies] = useState<AssessmentMethod[]>([]);
  const [revisedSections, setRevisedSections] = useState<SectionState[]>([]);
  const [practicalTips, setPracticalTips] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Handle DOCX files by extracting text
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const arrayBuffer = evt.target?.result as ArrayBuffer;
        try {
          const mammoth = (await import('mammoth')).default;
          const result = await mammoth.extractRawText({ arrayBuffer });
          const text = result.value;
          setAssignmentText(prev => {
             const newText = prev ? prev + '\n\n' + text : text;
             return newText;
          });
          // Clear any previously uploaded file binary to avoid sending docx to API
          setUploadedFile(null);
          // Optional: You could notify the user that text was extracted
        } catch (error) {
          console.error("Error reading Word file:", error);
          alert("שגיאה בקריאת קובץ Word. אנא נסה להעתיק את הטקסט ידנית.");
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // Handle PDF and other supported types
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      // Get base64 part
      const base64Data = result.split(',')[1];
      setUploadedFile({
        name: file.name,
        data: base64Data,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const startRedesign = async (initialText?: string) => {
    const textToAnalyze = initialText || assignmentText;
    if (!textToAnalyze.trim() && !uploadedFile) return;
    setAssignmentText(textToAnalyze);
    setMode('REDESIGN');
    setLoading(true);
    try {
      const filePayload = uploadedFile ? { data: uploadedFile.data, mimeType: uploadedFile.mimeType } : undefined;
      const analysis = await analyzeBloomTaxonomy(textToAnalyze, filePayload);
      setBloomAnalysis(analysis);
      setSelectedSkills(analysis.currentSkills);
      setCustomSkills([]);
      setStep(2);
      setMaxReachedStep(Math.max(maxReachedStep, 2));
    } catch (error: any) {
      const msg = error?.message || String(error);
      console.error("[v0] startRedesign error:", msg);
      console.error("[v0] startRedesign full error:", error);
      alert(`שגיאה בניתוח המטלה: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillToggle = (skill: Skill) => {
    setSelectedSkills(prev => 
      prev.some(s => s.name === skill.name) ? prev.filter(s => s.name !== skill.name) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = (newSkill: Skill) => {
    setCustomSkills(prev => [...prev, newSkill]);
    setSelectedSkills(prev => [...prev, newSkill]);
  };

  const handleGetInitialStrategies = async () => {
    if (selectedSkills.length === 0) return;
    setLoading(true);
    try {
      const res = await generateAssessmentStrategies(selectedSkills, numStudents);
      setStrategies(res.map((s: any) => ({ ...s, userSelectedCategory: s.type, userSelectedMethod: s.method })));
      setStep(3);
      setMaxReachedStep(Math.max(maxReachedStep, 3));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStrategySelection = (index: number, category: 'FaceToFace' | 'Submission', method?: string) => {
    const newStrategies = [...strategies];
    newStrategies[index] = { ...newStrategies[index], userSelectedCategory: category, userSelectedMethod: method || '' };
    setStrategies(newStrategies);
  };

  const moveSkillToGroup = (skillName: string, targetGroupId: string) => {
    const newStrategies = strategies.map(s => {
      const remainingSkills = s.skills.filter(sk => sk !== skillName);
      if (s.id === targetGroupId) return { ...s, skills: [...s.skills.filter(sk => sk !== skillName), skillName] };
      return { ...s, skills: remainingSkills };
    }).filter(s => s.skills.length > 0);
    setStrategies(newStrategies);
  };

  const addNewGroup = (skillName: string, isDefense: boolean = false) => {
    const updatedOldGroups = strategies.map(s => ({ ...s, skills: s.skills.filter(sk => sk !== skillName) })).filter(s => s.skills.length > 0);
    const newGroup: AssessmentMethod = {
      id: `group-${Date.now()}`,
      skills: skillName === 'כללי' ? ['הגנה על העבודה (Defense)'] : [skillName],
      method: isDefense ? 'בחינה אישית בע"פ' : '',
      type: 'FaceToFace',
      explanation: isDefense ? 'אימות למידה וזהות המגיש (Defense) - מומלץ במיוחד במטלות המותרות לביצוע עם AI.' : 'קבוצה חדשה.',
      userSelectedCategory: 'FaceToFace',
      userSelectedMethod: isDefense ? 'בחינה אישית בע"פ' : ''
    };
    setStrategies([...updatedOldGroups, newGroup]);
  };

  const handleFinalRephrase = async () => {
    if (!strategies.every(s => s.userSelectedMethod)) return;
    setLoading(true);
    try {
      const { sections, practicalTips } = await rephraseAssignment(assignmentText, selectedSkills, strategies, numStudents);
      setRevisedSections(sections.map(s => ({ ...s, status: 'pending', isEditing: false })));
      setPracticalTips(practicalTips);
      setStep(4);
      setMaxReachedStep(Math.max(maxReachedStep, 4));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUp = async (question: string) => {
    setChatHistory(prev => [...prev, { role: 'user', text: question }]);
    setLoading(true);
    try {
      const response = await askFollowUpQuestion({ originalText: assignmentText, revisedTask: revisedSections, strategies }, question, chatHistory);
      setChatHistory(prev => [...prev, { role: 'model', text: response || '' }]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetToHome = () => {
    setMode('HOME');
    setStep(1);
    setMaxReachedStep(1);
    setAssignmentText('');
    setUploadedFile(null);
    setBloomAnalysis(null);
    setCustomSkills([]);
    setSelectedSkills([]);
    setStrategies([]);
    setRevisedSections([]);
    setPracticalTips('');
    setChatHistory([]);
  };

  const handleGoBack = () => {
    setStep(prev => prev > 1 ? prev - 1 : prev);
    if (step === 1) setMode('HOME');
  };

  const updateSectionStatus = (index: number, status: 'approved' | 'removed') => {
    const newSections = [...revisedSections];
    newSections[index].status = status;
    setRevisedSections(newSections);
  };

  const updateSectionContent = (index: number, content: string) => {
    const newSections = [...revisedSections];
    newSections[index].content = content;
    setRevisedSections(newSections);
  };

  const toggleSectionEdit = (index: number) => {
    const newSections = [...revisedSections];
    newSections[index].isEditing = !newSections[index].isEditing;
    setRevisedSections(newSections);
  };

  const goToStep = (targetStep: number) => {
    if (targetStep <= maxReachedStep) {
      setStep(targetStep);
    }
  };

  return (
    <Layout title={mode === 'HOME' ? 'Re-Assess' : 'עיצוב מחדש'} onBack={mode !== 'HOME' ? handleGoBack : undefined}>
      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .skill-btn { transition: all 0.2s; }
        .skill-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .font-sans-normal { font-style: normal !important; font-family: 'Assistant', sans-serif; }
        .editor-textarea {
          font-family: 'Assistant', sans-serif;
          line-height: 1.625;
          font-size: 1.125rem;
          color: #1f2937;
        }
      `}</style>

      {mode === 'HOME' && (
        <div className="flex flex-col items-center gap-8 py-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-gray-800">איך המטלה שלך נראית בעידן ה-AI?</h2>
            <p className="text-xl text-gray-600 max-w-2xl">שיפור פדגוגיה ועידוד למידה משמעותית באמצעות עיצוב מחדש של דרכי הערכה.</p>
          </div>
          
          <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 max-w-3xl w-full text-amber-900 shadow-sm">
            <h3 className="flex items-center gap-2 font-bold text-lg mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              טיפ חשוב לפני שמתחילים
            </h3>
            <p className="leading-relaxed">
              לפני שתיגש לעיצוב מחדש, אנו ממליצים מאוד לקחת את המטלה הנוכחית שלך ולנסות לפתור אותה בעצמך באמצעות כלי AI (כמו ChatGPT, Claude, או Gemini). בדיקה זו תאפשר לך לראות במו עיניך באיזו מידה ניתן לקבל תשובה טובה ובכך לעזור לך לתכנן אם ואלו חלקים דורשים עיצוב מחדש, בנוסף כדאי לחשוב איזה ידע ומיומניות נדרשים כדי לשפר את תשובת הבינה ולשקול להכניס אותם לתוך תוכנית הלימודים.
            </p>
          </div>

          <div className="w-full max-w-md">
            <button onClick={() => { setMode('REDESIGN'); setStep(1); }} className="w-full bg-white border-2 border-green-100 p-8 rounded-2xl shadow-sm hover:shadow-md hover:border-green-400 text-center group transition-all">
              <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:bg-green-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">התחל עיצוב למידה מחדש</h3>
              <p className="text-gray-600">נתח מיומנויות ושדרג את המערך הפדגוגי לליווי מיטבי של הסטודנטים.</p>
            </button>
          </div>
        </div>
      )}

      {mode === 'REDESIGN' && (
        <div className="space-y-6 animate-fade-in">
          <Stepper currentStep={step} onStepClick={goToStep} maxReachedStep={maxReachedStep} />

          {step === 1 && (
            <StepInput
              assignmentText={assignmentText}
              setAssignmentText={setAssignmentText}
              uploadedFile={uploadedFile}
              onFileUpload={handleFileUpload}
              numStudents={numStudents}
              setNumStudents={setNumStudents}
              onNext={() => startRedesign()}
              loading={loading}
            />
          )}

          {step === 2 && bloomAnalysis && (
            <StepSkillsAnalysis
              bloomAnalysis={bloomAnalysis}
              selectedSkills={selectedSkills}
              handleSkillToggle={handleSkillToggle}
              customSkills={customSkills}
              onAddCustomSkill={handleAddCustomSkill}
              onNext={handleGetInitialStrategies}
              onBack={handleGoBack}
              loading={loading}
            />
          )}

          {step === 3 && strategies.length > 0 && (
            <StepStrategyBuilder
              strategies={strategies}
              numStudents={numStudents}
              updateStrategySelection={updateStrategySelection}
              moveSkillToGroup={moveSkillToGroup}
              addNewGroup={addNewGroup}
              onNext={handleFinalRephrase}
              onBack={handleGoBack}
              loading={loading}
            />
          )}

          {step === 4 && (
            <StepFinalResult
              revisedSections={revisedSections}
              practicalTips={practicalTips}
              updateSectionStatus={updateSectionStatus}
              updateSectionContent={updateSectionContent}
              toggleSectionEdit={toggleSectionEdit}
              chatHistory={chatHistory}
              onFollowUp={handleFollowUp}
              onReset={resetToHome}
              onBack={handleGoBack}
              loading={loading}
            />
          )}
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white p-12 rounded-3xl shadow-2xl flex flex-col items-center gap-8 border-2 border-indigo-100 animate-pulse">
            <div className="w-20 h-20 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center"><p className="font-bold text-2xl text-indigo-900 mb-2">מעבד פדגוגיה...</p></div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
