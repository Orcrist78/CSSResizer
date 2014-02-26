
/**!
 * @license CSSResizer.js v2.3
 * (c) 2014 Giuseppe Scotto Lavina <mailto:g.scotto@email.it>
 * Available under MIT license
 */


;(function(
  win, selectorStr, cssRulesStr, rulesStr, urlStr,
  styleStr, mediaStr, nameStr, nullStr, bs, nillStr,
  TRUE, FALSE, NULL, camelReg, doc, styleSheets
) {

  "use strict"

  var camelize = (function(cache, fn) {
    return function camelize(str) {
      str in cache || (cache[str] = str.replace(camelReg, fn))
      return cache[str]
    }
  })({}, function replaceMatch(match, chr) {
    return chr ? chr.toUpperCase() : nillStr
  }),

  parseVal = (function(
    v, o, c
  ) {
    var
      ret = {},
      idx = 0

    return function parseVal(val) {
      if((idx = val.indexOf(o)) >= 0) {
        ret.pre = val.substr(0, idx + 1)
        ret.val = val.substr(idx + 1)
      } else {
        ret.pre = nillStr
        ret.val = val
      }
      if((idx = ret.val.indexOf(c)) >= 0 ||
         (idx = ret.val.indexOf(v)) >= 0) {
        ret.post = ret.val.substr(idx)
        ret.val  = ret.val.substr(0, idx)
      } else
        ret.post = nillStr

      return ret
    }
  })(",", "(", ")"),

  scaleImg = (function(can) {
    var ctx = can.getContext("2d")

    return function scaleImg(val, ratio, idx, fn) {
      var
        img  = new Image(),
        url  = val.val,
        pre  = val.pre,
        post = val.post

      img.onload = function() {
        var
          width  = round(this.width  * ratio, 0),
          height = round(this.height * ratio, 0)

        can.width  = width
        can.height = height
        ctx.drawImage(this, 0, 0, width, height)
        fn(pre + can.toDataURL() + post, idx)
        this.onerror =
        this.onabort =
        this.onload  =
        img = null
      }
      img.onerror = img.onabort = function() {
        console.warn(url + " is unreachable!")
        fn(pre + url + post, idx)
        this.onerror =
        this.onabort =
        this.onload  =
        img = null
      }
      img.src = url
    }
  })(doc.createElement("canvas"))

  function round(val, dec) {
    var _dec = dec ? 10 * dec : 1
    return ((0.5 + val * _dec) ^ 0) / _dec
  }

  function CSSResizer(options) {
    return this.init(options)
  }

  CSSResizer.prototype = {

    _scaleValue: function(style, cprop, value, ratio, fn) {
      var
        vVal  = NULL,
        pVal  = nillStr,
        sVal  = nillStr,
        unit  = nillStr,
        units = this.options.units,
        aVal  = value.split(bs),
        idxV  = aVal.length,
        idxU  = 0,
        idxF  = 0,
        iVal  = 0,
        imgs  = 0

      for(; idxV-- && (vVal = parseVal(aVal[idxV])) && (pVal = vVal.val);)
        if(this.options.scaleImages && vVal.pre.indexOf(urlStr) >= 0) {
          if(ratio) {
            imgs++
            scaleImg(vVal, ratio, idxV, function(data, idx) {
              aVal[idx] = data
              if(!--imgs) {
                style[cprop] = aVal.join(bs)
                fn()
              }
            })
          } else
            return TRUE
        } else
        for(idxU = units.length; idxU-- && (unit = units[idxU]);)
          if(
            (idxF = pVal.indexOf(unit)) > 0      &&
            idxF === pVal.length - unit.length   &&
            (sVal = pVal.substr(0, idxF)).length &&
            (iVal = +sVal) == sVal && iVal
          ) {
            if(ratio)
              aVal[idxV] = vVal.pre +
                           round(iVal * ratio, 1) + unit +
                           vVal.post
            else
              return TRUE
          }

      if(!imgs && ratio) {
        style[cprop] = aVal.join(bs)
        fn()
      }

      return FALSE
    },

    _parseRule: function(cssRule, selector) {
      var
        styles    = NULL,
        value     = nillStr,
        cprop     = nillStr,
        prop      = nillStr,
        idxS      = 0,
        idxP      = 0

      if(!(selector in this.stylesCache))
        this.stylesCache[selector] = []
      if(styleStr in cssRule && (styles = cssRule.style) && styles.length) {
        this.stylesCache[selector].push(styles)
        for(idxS = styles.length; idxS-- && (prop = styles[idxS]);)
          for(idxP = this.options.properties.length; idxP--;)
            if(
              prop.indexOf(this.options.properties[idxP]) >= 0 &&
              (value = styles[(cprop = camelize(prop))])       &&
              this._scaleValue(styles, cprop, value)
            ) {
              if(!(selector in this.propsCache))
                this.propsCache[selector] = {}
              if(!(prop in this.propsCache[selector])) {
                this.propsCache[selector][prop] = []
                this.props2scale++
              }
              this.propsCache[selector][prop].push(value)
              break
            }
      }
    },

    init: function(options) {
      var
        option     = nillStr,
        styleSheet = NULL,
        cssRules   = NULL,
        cssRule    = NULL,
        subRules   = NULL,
        subRule    = NULL,
        idxSt      = 0,
        idxR       = 0,
        idxS       = 0

      this.destroy()
      for(option in this.defaults) this.options[option] = this.defaults[option]
      for(option in options) this.options[option] = options[option]
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
      this.options     = {}
      this.propsCache  = {}
      this.stylesCache = {}
      this.props2scale = 0
    },

    scale: function(ratio, fn) {
      var
        count    = this.props2scale,
        selector = nillStr,
        cssText  = nillStr,
        prop     = nillStr,
        style    = NULL,
        props    = NULL

      for(selector in this.propsCache) {
        props = this.propsCache[selector]
        style = this.stylesCache[selector][0]
        for(prop in props)
          this._scaleValue(
            style,
            camelize(prop),
            props[prop][0],
            ratio,
            function() {
              !--count && fn && fn()
            }
          )
      }
    },

    getStyle: function() {
      var
        selector  = nillStr,
        prop      = nillStr,
        buff      = nillStr,
        pre       = NULL,
        style     = NULL,
        props     = NULL

      this.cssWin && this.cssWin.close()
      this.cssWin = win.open(nillStr, nillStr, "width=800,height=600")
      this.cssWin.document.title = "style.css"
      pre = doc.createElement("pre")
      for(selector in this.propsCache) {
        props = this.propsCache[selector]
        style = this.stylesCache[selector]
        if(!style.length)
          console.warn(selector, style)
        else {
          buff = "\n" + selector + " {\n"
          for(prop in props) buff += "  " + prop + ": " + style[0][prop] + ";\n"
          buff += "}\n"
          pre.appendChild(doc.createTextNode(buff))
        }
      }
      this.cssWin.document.body.appendChild(pre)
    }
  }

  CSSResizer.prototype.defaults = {
    matchMedia:  FALSE,
    scaleImages: TRUE,
    properties: [
      "top", "bottom", "left", "right", "width", "height",
      "size", "transform", "position", "shadow", "spacing",
      "indent", "align", "offset", "clip", "image", "column"
    ],
    units: ["px", "cm", "mm", "em", "ex", "pt", "pc", "in"]
  }

  win.CSSResizer = CSSResizer

})(
  this,
  "selectorText", "cssRules", "rules", "url(",
  "style", "media", "name", "null", " ", "",
  true, false, null, /-+(.)?/g, document,
  document.styleSheets
)

