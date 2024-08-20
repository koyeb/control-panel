export type Metric = {
  labels?: Record<string, string>;
  samples: DataPoint[];
};

export type DataPoint = {
  date: string;
  value: number | undefined;
};

export type GraphDataPoint = {
  x: string;
  y: number | null;
};
