import imgDocker from '../images/docker.png';
import imgGit from '../images/git.png';
import { WrappedData } from '../wrapped-data';

export function DeploymentMethod({ data, next }: { data: WrappedData; next: () => void }) {
  if (data.deploymentMethod === 'docker') {
    return (
      <div onClick={next} className="col h-full justify-between gap-4 py-16 text-3xl font-semibold">
        <img src={imgDocker} />

        <p>Clearly, you know what you want in life and in infrastructure.</p>
        <p>Your favorite way to deploy is to use already built docker containers!</p>
      </div>
    );
  }

  return (
    <div onClick={next} className="col h-full justify-between gap-4 py-8 text-2xl font-semibold">
      <>
        <p>You&apos;re a go-getter and a git-pusher!</p>
        <p>You pushed a grand total of {data.pushes} times this year!</p>

        <img src={imgGit} className="w-full" />

        <p>And each time, you trusted us to build the code for you 🫡</p>
        <p>We did, for {data.buildTime} minutes. Keep pushing!</p>
      </>
    </div>
  );
}
