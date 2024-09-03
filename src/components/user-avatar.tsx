type UserAvatarProps = {
  user?: { avatarUrl: string };
};

export function UserAvatar({ user }: UserAvatarProps) {
  const { avatarUrl = 'https://gravatar.com/avatar' } = user ?? {};
  const url = new URL(avatarUrl);

  url.searchParams.set('default', 'retro');
  url.searchParams.set('size', '48');

  return <img className="size-6 rounded-full" src={url.toString()} />;
}
