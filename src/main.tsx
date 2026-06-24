import { AppRegistry } from 'react-native';
import App from '../App';

AppRegistry.registerComponent('Main', () => App);
AppRegistry.runApplication('Main', {
  initialProps: {},
  rootTag: document.getElementById('root'),
});
