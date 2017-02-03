import _ from 'lodash';

export const entityInflections = {
  'child': 'children',
  'teacher': 'teachers',
  'material': 'materials',
  'area': 'areas'
}

export const getCrsfToken = () => {
  if (document.getElementsByName("csrf-token")[0]) {
    return document.getElementsByName("csrf-token")[0].content;
  }
}

export const isProduction = () => {
  return (window.tc && window.sensei.env && window.sensei.env.production);
}

export const getSenseiToken = () => {
  return (window.TCPlugins && window.TCPlugins.userApiToken) || (window.tc && window.tc.env.userApiToken);
}

export const getClassroomId = () => {
  let classroom_id = _.get(window, 'tc.env.currentClassroomId');
  if (classroom_id === "" || classroom_id === "all") {
    classroom_id = _.get(window, 'tc.env.firstClassroomId');
  }
  return classroom_id;
}

export const baseUrl = () => {
  return _.get(window, 'sensei.env.baseUrl');
}
