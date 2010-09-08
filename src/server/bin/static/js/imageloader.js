/**
* A simple JavaScript image loaderimage loader
* @author Cuong Tham
* @url http://thecodecentral.com/2008/02/21/a-useful-javascript-image-loader
* @usage
* var loader = new ImageLoader('IMAGE_URL');
* //set event handler
* loader.loadEvent = function(url, image){
*   //action to perform when the image is loaded
*   document.body.appendChild(image);
* }
* loader.load();
*/

//source: http://snipplr.com/view.php?codeview&id=561
// Cross-browser implementation of element.addEventListener()
function addListener(element, type, expression, bubbling)
{
  bubbling = bubbling || false;
  if (window.addEventListener) { // Standard
      element.addEventListener(type, expression, bubbling);
      return true;
  } else if (window.attachEvent) { // IE
      element.attachEvent('on' + type, expression);
      return true;
  } else {
      return false;
  }
}

var ImageLoader = function(url){
  this.url = url;
  this.image = null;
  this.loadEvent = null;
};

ImageLoader.prototype = {
  load:function(){
    this.image = document.createElement('img');
    var url = this.url;
    var image = this.image;
    var loadEvent = this.loadEvent;
    addListener(this.image, 'load', function(e){
      if(loadEvent !== null){
        loadEvent(url, image);
      }
    }, false);
    this.image.src = this.url;
  },
  getImage:function(){
    return this.image;
  }
};