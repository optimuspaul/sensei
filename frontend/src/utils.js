import Case from 'case';
import _ from 'lodash';

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
