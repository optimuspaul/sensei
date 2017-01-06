

export const entityEnum = {
  'students': 'student',
  'teachers': 'teacher',
  'materials': 'material'
}

export const getCrsfToken = () => {
  if (document.getElementsByName("csrf-token")[0]) {
    return document.getElementsByName("csrf-token")[0].content;
  }
}

export const getSenseiToken = () => {
  return window.TCPlugins.userApiToken;
}

export const getClassroomId = () => {
  if (location.search.split("classroom_id=")) {
    return parseInt(location.search.split("classroom_id=")[1], 10);
  }
}
