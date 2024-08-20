import { ListItem, ListSections } from 'src/components/list';
import { Shortcut } from 'src/components/shortcut';

import { useCommandPalette } from './use-command-palette';

export function Navigation() {
  const { sections, page: activePage, onNavigationItemRef, pageChanged } = useCommandPalette();

  return (
    <aside className="scrollbar-green scrollbar-thin max-h-full overflow-y-auto border-r p-2">
      <ListSections
        sections={sections}
        renderItem={(page) => (
          <NavigationItem
            setRef={(element) => onNavigationItemRef(page, element)}
            icon={page.icon}
            label={page.label}
            shortcut={page.shortcut}
            onClick={() => pageChanged(page)}
            isActive={page === activePage}
          />
        )}
      />
    </aside>
  );
}

type NavigationItemProps = {
  setRef: (ref: HTMLElement | null) => void;
  icon: React.ReactNode;
  label: React.ReactNode;
  shortcut?: string;
  onClick?: () => void;
  isActive: boolean;
};

function NavigationItem({ setRef, icon, label, shortcut, onClick, isActive }: NavigationItemProps) {
  return (
    <ListItem
      ref={setRef}
      isActive={isActive}
      start={icon}
      end={shortcut && <Shortcut keystrokes={['meta', shortcut]} className="ml-auto" onTrigger={onClick} />}
      className="cursor-pointer"
      onClick={onClick}
    >
      {label}
    </ListItem>
  );
}
