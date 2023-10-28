import Link from 'next/link';
import slugify from 'slugify';
import { CounterStat } from '../lib/types.d';

const Num = ({ n }: { n: number }) => (
  <span className="font-mono">{n.toLocaleString('fr-FR')}</span>
);

const medal = (rank: number): string => {
  if (rank === 1) {
    return '🥇';
  } else if (rank === 2) {
    return '🥈';
  } else if (rank === 3) {
    return '🥉';
  }
  return '';
};

type Props = {
  stat: CounterStat;
  avg: boolean;
  rank: number;
  counterCount: number;
  click: () => void;
};

function Counter({ stat, avg, rank, counterCount, click }: Props) {
  const week = avg ? Math.round(stat.week / 7) : stat.week;
  const month = avg ? Math.round(stat.month / 30) : stat.month;
  const year = avg ? Math.round(stat.year / stat.daysThisYear) : stat.year;
  const total = avg ? Math.round(stat.total / stat.days) : stat.total;
  return (
    <div className="relative p-6">
      <div className="absolute top-0 right-0 text-center pt-4 pr-4 text-sm grey">
        {medal(rank)}
        <br />
        Top&nbsp;{rank}/{counterCount}
      </div>
      <Link href={`/details/${slugify(stat.label)}`}>
        <div className="cursor-pointer">
          <h2>{stat.label}</h2>
          <p className="text-sm">
            Voir la fréquentation détaillée{' '}
            <svg
              role="img"
              className="w-4 inline"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
            >
              <path
                fill="currentColor"
                d="M396.8 352h22.4c6.4 0 12.8-6.4 12.8-12.8V108.8c0-6.4-6.4-12.8-12.8-12.8h-22.4c-6.4 0-12.8 6.4-12.8 12.8v230.4c0 6.4 6.4 12.8 12.8 12.8zm-192 0h22.4c6.4 0 12.8-6.4 12.8-12.8V140.8c0-6.4-6.4-12.8-12.8-12.8h-22.4c-6.4 0-12.8 6.4-12.8 12.8v198.4c0 6.4 6.4 12.8 12.8 12.8zm96 0h22.4c6.4 0 12.8-6.4 12.8-12.8V204.8c0-6.4-6.4-12.8-12.8-12.8h-22.4c-6.4 0-12.8 6.4-12.8 12.8v134.4c0 6.4 6.4 12.8 12.8 12.8zM496 400H48V80c0-8.84-7.16-16-16-16H16C7.16 64 0 71.16 0 80v336c0 17.67 14.33 32 32 32h464c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16zm-387.2-48h22.4c6.4 0 12.8-6.4 12.8-12.8v-70.4c0-6.4-6.4-12.8-12.8-12.8h-22.4c-6.4 0-12.8 6.4-12.8 12.8v70.4c0 6.4 6.4 12.8 12.8 12.8z"
              ></path>
            </svg>
          </p>
        </div>
      </Link>
      <dl className="pt-4">
        <dt>Hier</dt>
        <dd>
          <Num n={stat.day} />
        </dd>
        <dt>Sur 7 jours</dt>
        <dd>
          <Num n={week} />
        </dd>
        <dt>Sur 30 jours</dt>
        <dd>
          <Num n={month} />
        </dd>
        <dt>Sur {stat.days} jours</dt>
        <dd>
          <Num n={total} />
        </dd>
        <dt>Cette année</dt>
        <dd>
          <Num n={year} />
        </dd>
        <dt>Compteurs</dt>
        <dd>
          <ul
            className="text-xs text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            onClick={click}
          >
            {stat.included.map((counter) => (
              <li key={counter}>{counter}</li>
            ))}
          </ul>
        </dd>
      </dl>
    </div>
  );
}

export default Counter;
