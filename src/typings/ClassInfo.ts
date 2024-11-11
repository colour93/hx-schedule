export interface IClassInfo {
  name: string;
  teacher: string;
  frequency: string;
  room: string;
}

export interface IClassTime {
  start: string;
  end: string;
}

export interface IClassFullInfo {
  classInfo: IClassInfo | null;
  timeInfo: IClassTime;
}