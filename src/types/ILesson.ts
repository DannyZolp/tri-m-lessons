export interface ILesson {
  id: string;
  location: string;
  teacherId: string;
  studentId: string | null;
  simpleTime: string; // e.g., 7th hour
  startTime: Date;
  endTime: Date;
}
