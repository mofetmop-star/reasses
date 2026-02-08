
export enum BloomLevel {
  Remember = 'זכירה',
  Understand = 'הבנה',
  Apply = 'יישום',
  Analyze = 'אנליזה',
  Evaluate = 'הערכה',
  Create = 'יצירה'
}

export interface Skill {
  name: string;
  bloomLevel: BloomLevel;
  reasoning: string;
}

export interface AssessmentMethod {
  id: string;
  skills: string[];
  method: string;
  type: 'FaceToFace' | 'Submission';
  explanation: string;
  userSelectedCategory?: 'FaceToFace' | 'Submission';
  userSelectedMethod?: string;
}

export type RedesignPreference = 'HighLevelClass' | 'ProcessSubmission' | 'Balanced';

export type AppMode = 'HOME' | 'TEST_AI' | 'REDESIGN';
