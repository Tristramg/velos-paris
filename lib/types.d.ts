export type CounterSummary = {
  total: number;
  lastDay: number;
  lastWeek: number;
  lastMonth: number;
  minDate: string;
  maxDate: string;
};

export type CounterMetadata = {
  id_compteur: string;
  nom_compteur: string;
  id: string;
  name: string;
  channel_id: string;
  channel_name: string;
  installation_date: string;
  url_photos_n1: string;
  coordinates: string;
};

export type CounterStat = {
  id: string;
  label: string;
  strippedLabel: string;
  days: number;
  yesterday: number;
  lastWeek: number;
  last30Days: number;
  average: number;
  included: string[];
  coordinates: [number, number];
};

export type CounterDetails = {
  time: string;
  count: number;
  id: string;
};

export type ParsedCount = {
  time: Date;
  count: number;
};

export type Counter = {
  name: string;
  img: string;
  week: CounterDetails[];
  month: CounterDetails[];
  year: CounterDetails[];
};
