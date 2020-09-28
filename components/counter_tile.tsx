import Link from 'next/link';
import slugify from 'slugify';
import { CounterStat } from '../lib/types.d';

const Num = ({ n }: { n: number }) => (
  <span className="font-mono">{n.toLocaleString('fr-FR')}</span>
);

function Counter({ stat }: { stat: CounterStat }) {
  return (
    <>
      <h2>{stat.label}</h2>
      <Link href={`/details/${slugify(stat.label)}`}>Voir les détails</Link>
      <dl className="pt-2">
        <dt>Hier</dt>
        <dd>
          <Num n={stat.yesterday} />
        </dd>
        <dt>Sur 7 jours </dt>
        <dd>
          <Num n={stat.lastWeek} />
        </dd>
        <dt>Sur 30 jours </dt>
        <dd>
          <Num n={stat.last30Days} />
        </dd>
        <dt>Moyenne</dt>
        <dd>
          (sur {stat.days} jours) <Num n={stat.average} />
        </dd>
        <dt>Compteurs</dt>
        <dd>
          <ul className="text-xs">
            {stat.included.map((counter) => (
              <li key={counter}>{counter}</li>
            ))}
          </ul>
        </dd>
      </dl>
    </>
  );
}

export default Counter;
