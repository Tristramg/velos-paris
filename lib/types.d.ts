import { DateTime } from 'luxon';

export type CounterSummary = {
  total: number;
  day: number;
  week: number;
  month: number;
  year: number;
  daysThisYear: number;
  minDate: DateTime;
  maxDate: DateTime;
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
  day: number;
  week: number;
  month: number;
  year: number;
  total: number;
  daysThisYear: number;
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

export type Detail = {
  name: string;
  img: string;
  date: string;
  coord: [number, number];
};

export type Counter = {
  title: string;
  details: Detail[];
  week: CounterDetails[];
  month: CounterDetails[];
  year: CounterDetails[];
};
