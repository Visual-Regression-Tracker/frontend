export interface IgnoreArea {
  id: string;
  x: number;
  y: number;
  rectX?: number;
  rectY?: number;
  width: number;
  height: number;
}

export interface UpdateIgnoreAreaDto {
  ids: (string | number)[];
  ignoreAreas: IgnoreArea[];
}
