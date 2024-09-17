import { Title } from 'src/components/title';
import { Translate } from 'src/intl/translate';

import { InviteMemberForm } from './components/invite-member-form';
import { MembersList } from './components/members-list';

const T = Translate.prefix('pages.team');

export function TeamPage() {
  return (
    <div className="col gap-4">
      <Title title={<T id="title" />} />
      <MembersList />
      <InviteMemberForm />
    </div>
  );
}
