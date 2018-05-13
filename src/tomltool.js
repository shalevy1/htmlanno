const TomlParser = require("toml");
const SpanAnnotation = require("./spanannotation.js");
const RelationAnnotation = require("./relationannotation.js");
const Annotation = require("./annotation.js");

exports.saveToml = (annotationSet)=>{
  const data = ["version = 0.1"];
  let id = 1;
  annotationSet.forEach((annotation)=>{
    annotation._id = id;
    id ++;
  });
  annotationSet.forEach((annotation)=>{
    data.push("");
    data.push(`[${annotation._id}]`);
    data.push(annotation.saveToml());
  });
  return [data.join("\n")];
};

/**
 * @param annotationFileObj ... Annotation object that is created by FileContainer#loadFiles()
 * @param viewer HtmlViewer obj, etc.
 * @param highlighter ... SpanAnnotation annotation container.
 * @param arrowConnector ... Relation annotation container.
 * @param colorMap
 * @param referenceId (optional) ... Used to identify annotations.
 */
exports.loadToml = (annotationFileObj, viewer, highlighter, arrowConnector, colorMap, referenceId) => {
  const toml = 'string' == typeof(annotationFileObj.content) ?
    TomlParser.parse(annotationFileObj.content) :
    annotationFileObj.content;

  renderAnnotation(annotationFileObj, toml, viewer, highlighter, arrowConnector, colorMap, referenceId);
};

function _getColor(colorMap, type, labelText) {
  return undefined != colorMap[type][labelText] ? colorMap[type][labelText] : colorMap.default;
}

function renderAnnotation(annotationFileObj, tomlObj, viewer, highlighter, arrowConnector, colorMap, referenceId) {
  for(key in tomlObj) {
    if ("version" == key) {
      continue;
    }
    // Span.
    if (SpanAnnotation.isMydata(tomlObj[key])) {
      const annotation = highlighter.addToml(key, tomlObj[key], referenceId, viewer);
      if (null != annotation) {
        annotation.setColor(_getColor(colorMap, annotation.type, annotation.text));
        annotation.setFileContent(annotationFileObj);
      } else {
        console.log(`Cannot create an annotation. id: ${key}, referenceId: ${referenceId}, toml(the following).`);
        console.log(tomlObj[key]);
      }
    }
  }
  viewer.reflectBuffer();

  for(key in tomlObj) {
    if ("version" == key) {
      continue;
    }
    // Relation(one-way, two-way, or link)
    if (RelationAnnotation.isMydata(tomlObj[key])) {
      annotation = arrowConnector.addToml(key, tomlObj[key], referenceId);
      if (null != annotation) {
        annotation.setColor(_getColor(colorMap, annotation.direction, annotation.text));
        annotation.setFileContent(annotationFileObj);
      } else {
        console.log(`Cannot create an annotation. id: ${key}, referenceId: ${referenceId}, toml(the following).`);
        console.log(tomlObj[key]);
      }
    }
  }
}
