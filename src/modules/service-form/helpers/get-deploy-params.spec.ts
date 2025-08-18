import { describe, expect, it } from 'vitest';

import { getDeployParams } from './get-deploy-params';
import { defaultServiceForm } from './initialize-service-form';

describe('getDeployParams', () => {
  it("returns the current configuration's deploy parameters", () => {
    const form = defaultServiceForm();

    form.serviceName = 'name';
    form.builder.type = 'dockerfile';

    const params = getDeployParams(form);

    expect(params.size).toEqual(3);
    expect(params.get('type')).toEqual('git');
    expect(params.get('name')).toEqual('name');
    expect(params.get('builder')).toEqual('dockerfile');
  });
});
