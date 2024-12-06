import { Footer } from '../components/footer';
import imgCroissants2 from '../images/croissants-2.png';
import imgNoTeam from '../images/no-team.png';
import { WrappedData } from '../wrapped-data';

export function Team({ data, next }: { data: WrappedData; next: () => void }) {
  return (
    <>
      {data.team.length === 1 && (
        <>
          <div className="col my-4 flex-1 justify-end gap-4">
            <p className="text-center text-2xl font-semibold">You did this all on your own, bravo!</p>
            <p className="text-center text-5xl">👏🏆</p>
          </div>

          <div className="col my-8 flex-1 justify-center gap-4">
            <p className="mx-8 text-center text-2xl">Next year, invite your dream team :)</p>
            <img src={imgNoTeam} />
          </div>
        </>
      )}

      {data.team.length > 1 && (
        <>
          <div className="col my-4 flex-1 justify-end gap-4">
            <p className="text-center text-2xl font-semibold">
              You and your teammates have a lot to be proud of!
            </p>
            <p className="text-center text-5xl">👏🏆</p>
          </div>

          <div className="col my-8 flex-1 justify-center gap-4">
            <p className="mx-8 text-center text-3xl font-semibold">Your team:</p>
            <p className="text-center text-4xl">{data.team.join(', ')}</p>
          </div>
        </>
      )}

      {data.team.length > 1 && (
        <div className="my-4">
          <img src={imgCroissants2} className="mx-auto w-2/3" />
          <p className="my-4 text-center text-2xl">Team work makes the dream work!</p>
          <img src={imgCroissants2} className="mx-auto w-2/3" />
        </div>
      )}

      <Footer next={next} />
    </>
  );
}
