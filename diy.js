new Vue({
  el: '#app',
  data () {
    return {
      map: '',
      layer: '',
      drawTool: '',
      mode: '',
      cur: '',
      showSet: '',
      plDefSymbol: {
        'lineColor': '#5298FF',
        'lineWidth': 3,
        'lineJoin': 'round',
        'lineCap': 'round',
        'lineOpacity': 0.8
      },
      pgDefSymbol: {
        'polygonFill': '#5298FF',
        'polygonOpacity': 0.5,
        'lineColor': '#5298FF',
        'lineWidth': 1,
        'lineJoin': 'round',
        'lineCap': 'round',
        'lineOpacity': 1
      },
      poDefSymbol: {
        'markerType': 'ellipse',
        'markerFill': "#ffffff",
        'markerLineColor': '#5298FF',
        'markerLineWidth': 2,
        'markerWidth': 8,
        'markerHeight': 8,
        'markerOpacity': 1
      },
      ptDefSymbol: {
        'textFill': '#5298FF',
        'textName': '文字',
        'textSize': 16,
      },
      plSymbol: {
        'lineColor': '#5298FF',
        'lineWidth': 3,
        'lineJoin': 'round',
        'lineCap': 'round',
        'lineOpacity': 0.8
      },
      pgSymbol: {
        'polygonFill': '#5298FF',
        'polygonOpacity': 0.5,
        'lineColor': '#5298FF',
        'lineWidth': 1,
        'lineJoin': 'round',
        'lineCap': 'round',
        'lineOpacity': 1
      },
      poSymbol: {
        'markerFile': 'pic/station_icon.png',
        'markerWidth': 11,
        'markerHeight': 11,
        'markerOpacity': 1
      },
      ptSymbol: {
        'textFill': '#5298FF',
        'textName': '文字',
        'textSize': 16,
      }
    }
  },
  methods: {
    drawpl () {
      this.mode = 'pl';
      this.drawTool.setMode('LineString').setSymbol(this.plDefSymbol).enable();
      this.map.setCursor('crosshair');
      if (this.cur) {
        this.cur.endEdit();
      }
    },
    drawpg () {
      this.mode = 'pg';
      this.drawTool.setMode('Polygon').setSymbol(this.pgDefSymbol).enable();
      this.map.setCursor('crosshair');
      if (this.cur) {
        this.cur.endEdit();
      }
    },
    drawpo () {
      this.mode = 'po';
      this.drawTool.setMode('Point').setSymbol(this.poDefSymbol).enable();
      this.map.setCursor('crosshair');
      if (this.cur) {
        this.cur.endEdit();
      }
    },
    drawpt () {
      this.mode = 'pt';
      this.drawTool.setMode('Point').setSymbol(this.ptDefSymbol).enable();
      this.map.setCursor('crosshair');
      if (this.cur) {
        this.cur.endEdit();
      }
    },
    closeSet () {
      this.cur.endEdit();
      this.showSet = false;
    }
  },
  watch: {
    plSymbol: {
      handler (val) {
        this.cur.updateSymbol(val);
        this.plDefSymbol = val;
      },
      deep: true
    },
    pgSymbol: {
      handler (val) {
        this.cur.updateSymbol(val);
        this.pgDefSymbol = val;
      },
      deep: true
    },
    poSymbol: {
      handler (val) {
        this.cur.updateSymbol(val);
        this.poDefSymbol = val;
      },
      deep: true
    },
    ptSymbol: {
      handler (val) {
        this.cur.updateSymbol(val);
        this.ptDefSymbol = val;
      },
      deep: true
    }
  },
  mounted () {
    let that = this;
    let mapCenter = [120.70, 28.00];
    let url = location.search;
    if (url) {
      let x = url.indexOf('lng=');
      let y = url.indexOf('lat=');
      if (x && y) {
        let lng = url.substring(x + 4, y - 1);
        let lat = url.substring(y + 4);
        mapCenter = [lng, lat];
      }
    }
    this.map = new maptalks.Map('map', {
      center: mapCenter,
      zoom: 14,
      minZoom: 1,
      maxZoom: 19,
      doubleClickZoom: false,
      spatialReference: {
        projection: 'baidu'
      },
      baseLayer: new maptalks.TileLayer('base', {
        'urlTemplate': 'http://online{s}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles=pl&scaler=1&p=1',
        'subdomains': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        'attribution': '&copy; <a target="_blank" href="http://map.baidu.com">Baidu</a>'
      })
    });
    let metric = new maptalks.control.Scale({
      'position': 'bottom-left',
      'maxWidth': 100,
      'metric': true,
      'imperial': false
    });
    this.map.addControl(metric);
    this.layer = new maptalks.VectorLayer('vector').addTo(this.map);
    this.drawTool = new maptalks.DrawTool({
      mode: 'LineString',
      once: true,
      autoPanAtEdge: true
    }).addTo(this.map).disable();
    this.drawTool.on('drawend', function (param) {
      that.layer.addGeometry(param.geometry);
      that.map.resetCursor();
      that.cur = param.geometry;
      param.geometry.setProperties({'mode': that.mode});
      param.geometry.on('click', function () {
        if (that.cur) {
          that.cur.endEdit();
        }
        that.cur = this;
        if (that.mode !== 'pt') {
          this.startEdit();
        }
        switch (this.getProperties().mode) {
          case 'pl':
            that.showSet = 'pl';
            that.plSymbol = this.getSymbol();
            break;
          case 'pg':
            that.showSet = 'pg';
            that.pgSymbol = this.getSymbol();
            break;
          case 'po':
            that.showSet = 'po';
            that.poSymbol = this.getSymbol();
            break;
          case 'pt':
            that.showSet = 'pt';
            that.ptSymbol = this.getSymbol();
            break;
          default:
            break;
        }
      });
    });
  }
});