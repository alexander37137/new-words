import { dataAccessDb } from './data-access-db';

describe('dataAccessDb', () => {
  it('should work', () => {
    expect(dataAccessDb()).toEqual('data-access-db');
  });
});
