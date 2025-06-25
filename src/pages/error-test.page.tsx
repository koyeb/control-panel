import { Button } from '@koyeb/design-system';
import { useState } from 'react';


export function ErrorTestPage() {
  const [renderError, setRenderError] = useState(false);

  if (renderError) {
    throw new Error('Render error');
  }

  return (
    <>
      <Button onClick={() => setRenderError(true)}>Render error</Button>
    </>
  );
}
