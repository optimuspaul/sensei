import Case from 'case';
import _ from 'lodash';
import createHistory from 'history/createBrowserHistory';
import moment from 'moment'

export const history = createHistory();

export const changeCase = (data, toCase = 'camel') => {
  return _.reduce(data, (current, val, key) => {
    current[Case[toCase](key)] = val;
    return current;
  }, {});
}


export const changeCases = (data, toCase) => {
  return _.map(data, (x) => {
    return changeCase(x, toCase);
  });
}

export const getKeyTime = (photoUrl) => {
  let split = photoUrl.split('/');
  let key = split[split.length-1];
  let keyTime = key.match(/[0-9]{4}(.*(?=_)|.*(?=\.))/)[0];
  return keyTime
}

export const parsePhotoSegmentTimestamp = (photoUrl) => {
  let key = photoUrl.split('/')[4]
  let keyTime = key.match(/[0-9]{4}(.*(?=_)|.*(?=\.))/)[0];

  let timestamp = moment.utc(`${keyTime.split('-').splice(0,3).join('-')} ${keyTime.split('-').splice(3,3).join(':')}`);
  return timestamp.toDate();
}
