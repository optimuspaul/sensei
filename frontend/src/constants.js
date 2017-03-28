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
  let classroom_id = _.get(window, 'tc.env.currentClassroomId');
  if (classroom_id === "" || classroom_id === "all") {
    classroom_id = _.get(window, 'tc.env.firstClassroomId');
  }
  return classroom_id;
}

export const baseUrl = () => {
  return _.get(window, 'sensei.env.baseUrl');
}


export const fakeNames = [
  "Nan Lark",
  "Cicely Thaler",
  "Dona Aguero",
  "Kathi Taff",
  "Hayley Whittenberg",
  "Ilana Modzelewski",
  "Nickole Farina",
  "Marcia Pixler",
  "Debbi Nielson",
  "Christal Virden",
  "Deandre Lovick",
  "Angele Raber",
  "Nidia Goheen",
  "Nisha Alejandro",
  "Milo Spurlin",
  "Shana Macky",
  "Long Son",
  "Ira Decaro",
  "Erwin Miracle",
  "Sierra Prato",
  "Roseanna Jang",
  "Darren Sia",
  "Willian Duren",
  "Rebbecca Eichner",
  "Carma Grenier",
  "Molly Page",
  "Delorse Tally",
  "Sadie Stiff",
  "Roma Treaster",
  "Marva Mosely",
  "Winford Fitting",
  "Darrick Tilman",
  "Diana Blanck",
  "Jama Keasler",
  "Monet Fiorini",
  "Elissa Gilles",
  "Ione Ammons",
  "Susannah Romanik",
  "Enda Schmidtke",
  "Rodger Birdsall",
  "Roselee Glidewell",
  "Debora Gorelick",
  "Ernesto Delosh",
  "Ophelia Worcester",
  "Donnette Templeman",
  "Venus Lester",
  "Jason Herndon",
  "Cletus Quon",
  "Elsa Shim",
  "Kacy Pfister"
]