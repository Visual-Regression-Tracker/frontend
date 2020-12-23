export type PaginatedData<T> = {
  data: T[];
  total: number;
  skip: number;
  take: number;
};
