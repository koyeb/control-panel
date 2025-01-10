import { action } from '@storybook/addon-actions';
import { Meta } from '@storybook/react';

import { createApiService } from 'src/api/mock/api-factories';
import { ApiMock } from 'src/api/mock/mock-api';
import { parseBytes } from 'src/application/memory';
import { createDate } from 'src/utils/date';
import { create } from 'src/utils/factories';

import { CreateVolumeDialog } from '../create-volume-dialog';

import { VolumesList } from './volumes-list';

export default {
  title: 'Modules/Volumes',
  parameters: { mockApi },
} satisfies Meta;

function mockApi() {
  const api = new ApiMock();
  const data = api.data;

  data.services = [
    createApiService({
      id: 'serviceId',
      name: 'my-service',
    }),
  ];

  api.mockEndpoint('createVolume', {});
  api.mockEndpoint('deleteVolume', {});
}

const volumes = [
  create.volume({
    name: 'vol-01',
    status: 'attached',
    region: 'fra',
    size: parseBytes('120GB'),
    serviceId: 'serviceId',
    createdAt: createDate('2024-01-01'),
  }),
  create.volume({
    name: 'vol-02',
    status: 'detached',
    region: 'par',
    size: parseBytes('16GB'),
    createdAt: createDate('2024-06-01'),
  }),
];

export const volumesList = () => <VolumesList volumes={volumes} onCreate={action('onCreate')} />;

export const createVolumeDialog = () => <CreateVolumeDialog />;
