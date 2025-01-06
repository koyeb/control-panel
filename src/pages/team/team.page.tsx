import { Title } from 'src/components/title';
import { createTranslate } from 'src/intl/translate';

import { InviteMemberForm } from './components/invite-member-form';
import { MembersList } from './components/members-list';

const T = createTranslate('pages.team');

export function TeamPage() {
  return (
    <div className="col gap-4">
      <Title title={<T id="title" />} />
      <MembersList />
      <InviteMemberForm />
    </div>
  );
}
