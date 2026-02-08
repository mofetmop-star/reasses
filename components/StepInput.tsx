
import React from 'react';
import { InfoBox } from './InfoBox';

interface StepInputProps {
  assignmentText: string;
  setAssignmentText: (text: string) => void;
  uploadedFile: { name: string, data: string, mimeType: string } | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  numStudents: number;
  setNumStudents: (num: number) => void;
  onNext: () => void;
  loading: boolean;
}

const StepInput: React.FC<StepInputProps> = ({ 
  assignmentText, setAssignmentText, uploadedFile, onFileUpload, numStudents, setNumStudents, onNext, loading 
}) => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <InfoBox title="תחילת תהליך העיצוב">
        כאן נגדיר את הבסיס למטלה החדשה. וודא שאתה מזין את מספר הסטודנטים המדויק, שכן העוזר יציע שיטות הערכה בנות-יישום (Scalable) בהתאם לגודל הכיתה.
      </InfoBox>
      <div className="grid gap-6">
        <div>
          <label className="block text-lg font-semibold mb-2">הנחיית המטלה לעיצוב מחדש:</label>
          <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">אפשרות א': הדבק טקסט</label>
                <textarea 
                  value={assignmentText} 
                  onChange={(e) => setAssignmentText(e.target.value)} 
                  className="w-full h-32 p-4 border rounded-lg outline-none focus:ring-2 focus:ring-green-500" 
                  placeholder="מה הסטודנטים צריכים לעשות כיום?" 
                />
              </div>

              <div className="flex items-center gap-4 my-2">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-gray-400 text-sm font-bold">או</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">אפשרות ב': העלה קובץ (PDF / Word)</label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition-colors text-center cursor-pointer group">
                  <input 
                    type="file" 
                    accept=".pdf,.docx,.txt" 
                    onChange={onFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center pointer-events-none group-hover:text-green-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2 group-hover:text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {uploadedFile ? (
                        <span className="text-green-700 font-bold">{uploadedFile.name}</span>
                    ) : (
                      <span className="text-gray-500">לחץ להעלאת קובץ</span>
                    )}
                  </div>
                </div>
              </div>
          </div>
        </div>
        <div>
          <label className="block text-lg font-semibold mb-2">מספר סטודנטים בקורס:</label>
          <input type="number" value={numStudents} onChange={(e) => setNumStudents(parseInt(e.target.value))} className="w-32 p-3 border rounded-lg font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>
      <button onClick={onNext} disabled={loading || (!assignmentText && !uploadedFile)} className="mt-8 w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-all shadow-md">נתח מיומנויות בטקסונומיית בלום</button>
    </div>
  );
};

export default StepInput;
