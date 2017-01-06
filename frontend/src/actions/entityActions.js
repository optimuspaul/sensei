import _ from 'lodash';
import {getCrsfToken} from './../constants';

const ADD_ENTITIES = 'ADD_ENTITIES';
export const addEntities = (entityType, entities) => {
  return {
    type: ADD_ENTITIES,
    entityType,
    entities
  }
}

export const fetchStudents = () => {
  return (dispatch) => {
    fetch('/api/v1/children.json', {
      credentials: 'include',
      headers: {
        "X-CSRF-Token": getCrsfToken()
      }
    }).then(function(response) {
      return response.text()
    }).then((body) => {
      let students = JSON.parse(body);
      const decoratedStudents = students.map((student) => {
        return _.merge(student, {displayName: `${student.first_name} ${student.last_name}`});
      })
      dispatch(addEntities('students', decoratedStudents));
    })
  }
}

export const fetchTeachers = () => {
  return (dispatch) => {
    fetch('/api/v1/teachers.json', {
      credentials: 'include',
      headers: {
        "X-CSRF-Token": getCrsfToken()
      }
    }).then(function(response) {
      return response.text()
    }).then((body) => {
      let teachers = JSON.parse(body);
      const decoratedTeachers = teachers.map((teacher) => {
        return _.merge(teacher, {displayName: `${teacher.first_name} ${teacher.last_name}`});
      })
      dispatch(addEntities('teachers', decoratedTeachers));
    })
  }
}




