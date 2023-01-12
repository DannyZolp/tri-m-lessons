export interface ILesson {
  location: string;
  teacherId: string;
  studentId: string;
  simpleTime: string; // e.g., 7th hour
  startTime: Date;
  endTime: Date;
}
