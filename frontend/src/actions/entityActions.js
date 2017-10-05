import _ from 'lodash';
import {getCrsfToken, getSenseiToken, getClassroomId, getSchoolId, baseUrl, tcBaseUrl} from './../constants';
import {handleRequest} from './requestActions';
import {changeCase} from './../utils';
import {fakeNames} from './../constants';

const ADD_ENTITIES = 'ADD_ENTITIES';
export const addEntities = (entityType, entities) => {
  return {
    type: ADD_ENTITIES,
    entityType,
    entities
  }
}



const HANDLE_SAVE_ENTITY_SUCCESS = 'HANDLE_SAVE_ENTITY_SUCCESS';
export const handleSaveEntitySuccess = (entityType, entity) => {
  return {
    type: HANDLE_SAVE_ENTITY_SUCCESS,
    entityType,
    entity
  }
}

const TOGGLE_ANONYMIZER = 'TOGGLE_ANONYMIZER';
export const toggleAnonymizer = () => {
  return {
    type: TOGGLE_ANONYMIZER
  }
}



export const fetchChildren = () => {
  return (dispatch, getState) => {
    let state = getState();

    fetch(`${tcBaseUrl()}/api/v1/children.json?classroom_id=${getClassroomId()}&school_id=${getSchoolId()}`, {
      credentials: 'include',
      headers: {
        "X-CSRF-Token": getCrsfToken()
      }
    }).then(function(response) {
      return response.text()
    }).then((body) => {
      let children = JSON.parse(body);
      const decoratedChildren = children.map((child, index) => {
        let displayName = state.entities.anonymize ? fakeNames[index] : `${child.first_name} ${child.last_name}`;
        return _.merge(child, {displayName});
      })
      dispatch(addEntities('children', decoratedChildren));
    })
  }
}

export const fetchTeachers = () => {
  return (dispatch) => {
    fetch(`${tcBaseUrl()}/api/v1/users.json?classroom_id=${getClassroomId()}&school_id=${getSchoolId()}&roles[]=teacher`, {
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

export const fetchEntities = (entityType) => {
  return (dispatch) => {
    fetch(`${baseUrl()}/api/v1/${entityType}?classroom_id=${getClassroomId()}`, {
      headers: {
        'X-SenseiToken': getSenseiToken(),
        'Content-Type': 'application/json'
      }
    }).then(function(response) {
      return response.text()
    }).then((body) => {
      let entities = JSON.parse(body);
      const decoratedEntities = entities.map((entity) => {
        return _.merge(changeCase(entity, 'camel'), {displayName: entity.name});
      });
      dispatch(addEntities(entityType, decoratedEntities));
    })
  }
}


export const fetchMaterials = () => {
  return (dispatch) => {
    fetch(`${tcBaseUrl()}/api/v1/classrooms.json?school_id=${getSchoolId()}`, {
      credentials: 'include',
      headers: {
        "X-CSRF-Token": getCrsfToken()
      }
    }).then(function(response) {
      return response.text()
    }).then(function(body) {
      let classrooms = JSON.parse(body)
      let classroom = _.find(classrooms, (classroom) => {
        return classroom.id === parseInt(getClassroomId(),10);
      });
      if (classroom) {
        return fetch(`${tcBaseUrl()}/api/v1/lesson_sets/${classroom.lesson_set_id}.json?school_id=${getSchoolId()}`, {
          credentials: 'include',
          headers: {
            "X-CSRF-Token": getCrsfToken()
          }
        });
      }
    }).then(function(response) {
      return response.text();
    }).then((body) => {
      let lessonSet = JSON.parse(body);
      let getMaterials = (obj) => {
        let objs = obj.type === 'material' ? [{name: obj.name, id: obj.id, displayName: obj.name, classroom_id: getClassroomId()}] : [];
        return obj.children ? _.flatten(_.concat(objs, _.map(obj.children, getMaterials))) : obj;
      }
      let materials = getMaterials(lessonSet);
      dispatch(addEntities('materials', materials));
    })
  }
}

export const saveEntity = (entityType, entity, requestId) => {
  return (dispatch, getState) => {
    dispatch(handleRequest(requestId, 'pending', entity));
    let saveableEntity = _.merge(changeCase(entity, 'snake'), {classroom_id: getClassroomId()});
    fetch(`${baseUrl()}/api/v1/${entityType}`, {
      headers: {
        'X-SenseiToken': getSenseiToken(),
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(saveableEntity)
    }).then(function(response) {
      return response.text();
    }).then((body) => {
      let savedEntity = JSON.parse(body);
      dispatch(handleSaveEntitySuccess(entityType, _.merge(changeCase(savedEntity, 'camel'), {displayName: savedEntity.name})));
      dispatch(handleRequest(requestId, 'success', savedEntity));
    }).catch((error) => {
      dispatch(handleRequest(requestId, 'error', {message: 'Something went wrong.'}));
    })
  }
}

export const updateEntity = (entityType, entity, requestId) => {
  return (dispatch, getState) => {
    dispatch(handleRequest(requestId, 'pending', entity));
    let saveableEntity = _.merge(changeCase(entity, 'snake'), {classroom_id: getClassroomId()});
    fetch(`${baseUrl()}/api/v1/${entityType}/${entity.id}`, {
      headers: {
        'X-SenseiToken': getSenseiToken(),
        'Content-Type': 'application/json'
      },
      method: 'PUT',
      body: JSON.stringify(saveableEntity)
    }).then(function(response) {
      return response.text();
    }).then((body) => {
      let savedEntity = JSON.parse(body);
      dispatch(handleSaveEntitySuccess(entityType, _.merge(changeCase(savedEntity, 'camel'), {displayName: savedEntity.name})));
      dispatch(handleRequest(requestId, 'success', savedEntity));
    }).catch((error) => {
      dispatch(handleRequest(requestId, 'error', {message: 'Something went wrong.'}));
    })
  }
}


