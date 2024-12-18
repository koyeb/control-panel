import imgCroissants2 from '../images/croissants-2.png';
import imgNoTeam from '../images/no-team.png';
import { WrappedData } from '../wrapped-data';

export function Team({ data, next }: { data: WrappedData; next: () => void }) {
  return (
    <div onClick={next} className="col h-full justify-between gap-4 pt-16 text-center text-2xl font-semibold">
      {data.team.length === 1 && (
        <>
          <div className="col gap-4">
            <p>You did this all on your own, bravo!</p>
            <p className="text-5xl">👏🏆</p>
          </div>

          <p className="mx-8 font-normal">Next year, invite your dream team :)</p>
          <img src={imgNoTeam} />
        </>
      )}

      {data.team.length > 1 && (
        <>
          <div className="col gap-4">
            <p>You and your teammates have a lot to be proud of!</p>
            <p className="text-5xl">👏🏆</p>
          </div>

          <p className="text-center">Your team:</p>
          <p className="text-4xl">{data.team.join(', ')}</p>

          <div className="col gap-4">
            <img src={imgCroissants2} className="mx-auto w-2/3" />
            <p className="text-2xl font-medium">Team work makes the dream work!</p>
            <img src={imgCroissants2} className="mx-auto w-2/3 -scale-x-100" />
          </div>
        </>
      )}
    </div>
  );
}
