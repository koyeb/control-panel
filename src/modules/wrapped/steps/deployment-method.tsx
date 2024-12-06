import { Footer } from '../components/footer';
import imgDocker from '../images/docker.png';
import imgGit from '../images/git.png';
import { WrappedData } from '../wrapped-data';

export function DeploymentMethod({ data, next }: { data: WrappedData; next: () => void }) {
  return (
    <>
      {data.deploymentMethod === 'git' && (
        <>
          <div className="col flex-1 justify-evenly">
            <p className="text-2xl">You&apos;re a go-getter and a git-pusher!</p>
            <p className="text-2xl font-semibold">
              You pushed a grand total of {data.pushes} times this year!
            </p>
          </div>

          <div className="mx-8 my-4">
            <img src={imgGit} className="w-full" />
          </div>

          <div className="col flex-1 justify-evenly">
            <p className="text-xl">And each time, you trusted us to build the code for you 💫</p>
            <p className="text-xl">We did, for {data.buildTime} minutes. Keep pushing!</p>
          </div>
        </>
      )}

      {data.deploymentMethod === 'docker' && (
        <>
          <div className="mx-8 my-4">
            <img src={imgDocker} className="w-full" />
          </div>

          <div className="col flex-1 justify-evenly">
            <p className="text-2xl">Clearly, you know what you want in life and in infrastructure.</p>
            <p className="text-2xl">Your favorite way to deploy is to use already built docker containers!</p>
          </div>
        </>
      )}

      <Footer next={next} />
    </>
  );
}
