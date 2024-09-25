import { api } from './api';

void api;

/**
 * Use this file to intercept API requests, for example to change the query
 * parameters or to mock the response.
 *
 * To avoid git tracking changes on this file, run
 * git update-index --skip-worktree <path>
 *
 * Example:
 *
 * api.listServices.before = (params) => {
 *   params.query!.limit = '1';
 * };
 *
 * api.getService.after = (params, result) => {
 *   if (params.path.id === 'some-id') {
 *     result.service!.status = 'DEGRADED';
 *   }
 * }
 */
