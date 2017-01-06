import reducer from './../reducers';

import { createStore, applyMiddleware} from 'redux';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';


const middleware = [ thunk ]
if (process.env.NODE_ENV !== 'production') {
  middleware.push(createLogger())
}



const store = createStore(
  reducer,
  applyMiddleware(...middleware)
)

window.SMSTore = store;

export default store;
