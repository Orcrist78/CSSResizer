/**!
 * @license CSSResizer.js v0.7
 * (c) 2014 Giuseppe Scotto Lavina <mailto:g.scotto@email.it>
 * Available under MIT license
 */


;(function(
  win, selectorStr, cssRulesStr, rulesStr, styleStr,
  mediaStr, nameStr, nullStr, bs, nillStr, TRUE, FALSE,
  NULL, mt, styleSheets, camelReg
) {

  "use strict"

  var parseVal = (function(
    ret, v, o, c, i
  ) {
    return function parseVal(val) {
      if((i = val.indexOf(o)) >= 0) {
        ret.pre = val.substr(0, i + 1)
        ret.val = val.substr(i + 1)
      } else {
        ret.pre = nillStr
        ret.val = val
      }
      if((i = ret.val.indexOf(v)) >= 0 ||
         (i = ret.val.indexOf(c)) >= 0) {
        ret.post = ret.val.substr(i)
        ret.val  = ret.val.substr(0, i)
      } else
        ret.post = nillStr

      return ret
    }
  })({}, ",", "(", ")", 0),

  camelize = (function(fn) {
    return function(str) {
      return str.replace(camelReg, fn)
    }
  })(function(match, chr) {
    return chr ? chr.toUpperCase() : nillStr
  })


  function CSSResizer(options) {
    return this.init(options)
  }

  CSSResizer.prototype = {

    _scaleValue: function(values, ratio) {
      var
        vVal  = NULL,
        pVal  = nillStr,
        sVal  = nillStr,
        unit  = nillStr,
        units = this.options.units,
        aVal  = values.split(bs),
        idxV  = aVal.length,
        idxU  = 0,
        idxF  = 0,
        iVal  = 0

      for(; idxV-- && (vVal = parseVal(aVal[idxV])) && (pVal = vVal.val);)
        for(idxU = units.length; idxU-- && (unit = units[idxU]);)
          if(
            (idxF = pVal.indexOf(unit)) > 0      &&
            idxF === pVal.length - unit.length   &&
            (sVal = pVal.substr(0, idxF)).length &&
            (iVal = +sVal) == sVal && iVal
          ) {
            if(ratio)
              aVal[idxV] = vVal.pre +
                           (mt.round(iVal * ratio * 10) / 10) + unit +
                           vVal.post
            else
              return FALSE
          }

      return aVal.join(bs)
    },

    _parseRule: function(cssRule, selector) {
      var
        skip      = TRUE,
        styles    = NULL,
        propCheck = nillStr,
        property  = nillStr,
        value     = nillStr,
        idxS      = 0,
        idxP      = 0

      if(!(selector in this.stylesCache)) this.stylesCache[selector] = []
      if(styleStr in cssRule && (styles = cssRule.style) && styles.length) {
        this.stylesCache[selector].push(styles)
        for(idxS = styles.length; idxS--;) {
          skip     = TRUE
          property = styles[idxS]
          value    = styles[camelize(property)]
          for(idxP = this.options.properties.length; idxP--;)
            if(property.indexOf(this.options.properties[idxP]) >= 0)
              if((skip = this._scaleValue(value)) === FALSE) break
          if(skip === FALSE) {
            if(!(selector in this.propertiesCache))
              this.propertiesCache[selector] = {}
            if(!(property in this.propertiesCache[selector]))
              this.propertiesCache[selector][property] = []
            this.propertiesCache[selector][property].push(value)
          }
        }
      }
    },

    init: function(options) {
      var
        opt        = nillStr,
        styleSheet = NULL,
        cssRules   = NULL,
        cssRule    = NULL,
        subRules   = NULL,
        subRule    = NULL,
        idxSt      = 0,
        idxR       = 0,
        idxS       = 0

      this.destroy()
      for(opt in this.defaults) this.options[opt] = this.defaults[opt]
      for(opt in options) this.options[opt] = options[opt]
      for(idxSt = styleSheets.length; idxSt--;) {
        styleSheet = styleSheets[idxSt]
        cssRulesStr in styleSheet && styleSheet.cssRules && (cssRules = styleSheet.cssRules)
        rulesStr in styleSheet && styleSheet.rules && (cssRules = styleSheet.rules)
        if(cssRules)
          for(idxR = cssRules.length; idxR--;)
            if((cssRule = cssRules[idxR]) && selectorStr in cssRule) //Normal Style
              this._parseRule(cssRule, cssRule.selectorText)
            else if(mediaStr in cssRule && cssRulesStr in cssRule) { //MediaQuery
              if(this.options.matchMedia && !(matchMedia(cssRule.media.mediaText)).matches)
                continue
              cssRulesStr in cssRule && (subRules = cssRule.cssRules)
              rulesStr in cssRule && (subRules = cssRule.rules)
              for(idxS = subRules.length; idxS--;) {
                subRule = subRules[idxS]
                this._parseRule(subRule, subRule.selectorText)
              }
            } else if(nameStr in cssRule) { //FrameRule
              cssRulesStr in cssRule && (subRules = cssRule.cssRules)
              rulesStr in cssRule && (subRules = cssRule.rules)
              for(idxS = subRules.length; idxS--;)
                this._parseRule(subRules[idxS], cssRule.name)
            } else {  //FontFace ? Include ?
            }
      }
    },

    destroy: function() {
      this.options         = {}
      this.stylesCache     = {}
      this.propertiesCache = {}
    },

    scale: function(ratio) {
      var
        selector = nillStr,
        cssText  = nillStr,
        prop     = nillStr,
        props    = NULL

      for(selector in this.propertiesCache) {
      	cssText = nillStr
        props = this.propertiesCache[selector]
        for(prop in props)
          cssText += prop + ":" + this._scaleValue(props[prop][0], ratio) + ";"
        this.stylesCache[selector][0].cssText += cssText
      }
    },

    getStyle: function() {
      var
        formatted = nillStr,
        selector  = nillStr,
        prop      = nillStr,
        out       = nillStr,
        style     = NULL,
        props     = NULL

      for(selector in this.propertiesCache) {
        props = this.propertiesCache[selector]
        style = this.stylesCache[selector]
        if(!style.length) console.warn(selector, style)
        else {
          out += "\n" + selector + " {\n"
          for(prop in props) out += "  " + prop + ": " + style[0][prop] + ";\n"
          out += "}\n"
        }
      }
      return out
    }
  }

  CSSResizer.prototype.defaults = {
    matchMedia: FALSE,
    properties: [
      "top", "bottom", "left", "right", "width", "height",
      "size", "transform", "position", "shadow", "spacing",
      "indent", "align", "offset", "clip", "image", "column"
    ],
    units: ["px", "cm", "mm", "em", "ex", "pt", "pc", "in"]
  }

  win.CSSResizer = CSSResizer

})(
  this, "selectorText", "cssRules", "rules",
  "style", "media", "name", "null", " ", "",
  true, false, null, Math, document.styleSheets,
  /-+(.)?/g
)
