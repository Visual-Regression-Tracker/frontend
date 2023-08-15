export interface IgnoreArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface UpdateIgnoreAreaDto {
  ids: string[] | number[];
  ignoreAreas: IgnoreArea[];
}
