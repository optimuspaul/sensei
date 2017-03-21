import _ from 'lodash';

export const entityInflections = {
  'child': 'children',
  'teacher': 'teachers',
  'material': 'materials',
  'area': 'areas'
}

export const env = process.env.NODE_ENV;

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
  let classroomId = _.get(window, 'tc.env.currentClassroomId');
  if (classroomId === "" || classroomId === "all") {
    classroomId = _.get(window, 'tc.env.firstClassroomId');
  }
  return classroomId;
}

export const getSchoolId = () => {
  let schoolId = _.get(window, 'tc.env.currentSchoolId');
  return schoolId;
}

export const baseUrl = () => {
  return _.get(window, 'sensei.env.baseUrl');
}
