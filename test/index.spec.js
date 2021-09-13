import getReadAloudClient, { getAvailableProviders } from '../index.js';

describe('get available providers', () => {
    it('should return providers ids', () => {
        expect(getAvailableProviders()).toContain('native');
        expect(getAvailableProviders()).toContain('readweb');
    });
});

describe('get read aloud client', () => {
    it('fails without a provider', () =>
        expect(getReadAloudClient()).rejects.toMatchObject({ message: 'Provider undefined not found.' }));
    it('fails for an unknown provider', () =>
        expect(getReadAloudClient('foo')).rejects.toMatchObject({ message: 'Provider foo not found.' }));
});
