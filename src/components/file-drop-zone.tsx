import { useCallback, useState } from 'react';

import { preventDefault, withPreventDefault } from 'src/application/dom-events';
import { IconFilePlus } from 'src/components/icons';
import { Translate } from 'src/intl/translate';

type FileDropZoneProps = {
  children: React.ReactNode;
  onDrop: (files: FileList) => void;
};

export function FileDropZone({ children, onDrop }: FileDropZoneProps) {
  const [visible, setVisible] = useState(false);

  const handleDrop = useCallback<React.DragEventHandler>(
    (event) => {
      setVisible(false);
      onDrop(event.dataTransfer.files);
    },
    [onDrop],
  );

  return (
    <div
      onDragEnter={() => setVisible(true)}
      onDragLeave={() => setVisible(false)}
      onDragOver={preventDefault}
      onDrop={withPreventDefault(handleDrop)}
    >
      {visible && <DropZone />}
      {!visible && children}
    </div>
  );
}

function DropZone() {
  return (
    <div className="col pointer-events-none h-40 items-center justify-center gap-2 rounded-lg border-2 border-dashed ">
      <IconFilePlus className="text-icon size-12" />

      <span className="text-dim">
        <Translate id="common.dragFileHere" />
      </span>
    </div>
  );
}
