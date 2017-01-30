import _ from 'lodash';
import {getCrsfToken, getSenseiToken, getClassroomId, baseUrl} from './../constants';
import {handleRequest} from './requestActions';
import {changeCase} from './../utils';

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



export const fetchChildren = () => {
  return (dispatch) => {
    fetch(`/api/v1/children.json?classroom_id=${getClassroomId()}`, {
      credentials: 'include',
      headers: {
        "X-CSRF-Token": getCrsfToken()
      }
    }).then(function(response) {
      return response.text()
    }).then((body) => {
      let children = JSON.parse(body);
      const decoratedChildren = children.map((child) => {
        return _.merge(child, {displayName: `${child.first_name} ${child.last_name}`});
      })
      dispatch(addEntities('children', decoratedChildren));
    })
  }
}

export const fetchTeachers = () => {
  return (dispatch) => {
    fetch(`/api/v1/users.json?classroom_id=${getClassroomId()}&roles[]=teacher`, {
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
