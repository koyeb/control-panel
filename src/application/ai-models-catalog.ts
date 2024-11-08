import { slugify } from 'src/utils/strings';

export type AiModel = {
  name: string;
  slug: string;
  image: string;
};

export const aiModels: Array<AiModel> = [
  {
    name: 'meta-llama/Llama-3.1-8B',
    slug: slugify('meta-llama/Llama-3.1-8B'),
    image: 'koyeb/meta-llama-3.1-8b:latest',
  },
  {
    name: 'NousResearch/Hermes-3-Llama-3.1-8B',
    slug: slugify('NousResearch/Hermes-3-Llama-3.1-8B'),
    image: 'koyeb/nousresearch-hermes-3-llama-3.1-8b:latest',
  },
  {
    name: 'mistralai/Mistral-7B-Instruct-v0.3',
    slug: slugify('mistralai/Mistral-7B-Instruct-v0.3'),
    image: 'koyeb/mistralai-mistral-7b-instruct-v0.3:latest',
  },
  {
    name: 'google/gemma-2-9b-it',
    slug: slugify('google/gemma-2-9b-it'),
    image: 'koyeb/google-gemma-2-9b-it:latest',
  },
  {
    name: 'Qwen/Qwen2.5-7B-Instruct',
    slug: slugify('Qwen/Qwen2.5-7B-Instruct'),
    image: 'koyeb/qwen-qwen2.5-7b-instruct:latest',
  },
];
