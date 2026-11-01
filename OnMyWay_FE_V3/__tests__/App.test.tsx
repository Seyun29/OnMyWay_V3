import React from 'react';
import BootSplash from 'react-native-bootsplash';
import renderer, {act} from 'react-test-renderer';
import App from '../App';

jest.mock('../src/navigations', () => () => null);

it('hydrates preferences and renders the app root', async () => {
  let tree: renderer.ReactTestRenderer;

  await act(async () => {
    tree = renderer.create(<App />);
  });
  await act(async () => {
    await new Promise<void>(resolve => setImmediate(() => resolve()));
  });

  expect(tree!.toJSON()).not.toBeNull();
  expect(BootSplash.hide).toHaveBeenCalledWith({fade: true});
});
