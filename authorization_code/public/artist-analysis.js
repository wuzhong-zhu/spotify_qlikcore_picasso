import $ from 'jquery';
import Halyard from 'halyard.js';
import angular from 'angular';
import enigma from 'enigma.js';
import enigmaMixin from 'halyard.js/dist/halyard-enigma-mixin';
import qixSchema from 'enigma.js/schemas/3.2.json';
import picasso from 'picasso.js';
import * as d3 from 'd3';
import picassoQ from 'picasso-plugin-q';
picasso.use(picassoQ);
picasso.component('tooltip', {
  // The require property allows us to pull in our dependencies, in this case the chart instance for shape lookups and the renderer for rendering our nodes.
  require: ['chart', 'renderer'],
  // A component can define a set of default properties that expose in the current context. In our case we'll just allow some simple style related properties to be set by the users.
  defaultSettings: {
  	background: '#f9f9f9',
    fontSize: '12px'
  },
  // We require a particular type of renderer, the available once are svg/canvas/dom. Since we want to do be able do CSS layouting we'll use the dom-renderer. It's available in the context as `renderer`.
  renderer: 'dom',
  // By defining a `on` property we're able to bind custom events to the component.
  on: {
    // From the chart instance we'll be able to emit a the `hover` event.
    hover(e) {
      const b = this.chart.element.getBoundingClientRect();
      this.state.nodes = this.chart.shapesAt({
        x: e.clientX - b.left,
        y: e.clientY - b.top
      });
      this.renderer.render(this.buildNodes())
    }
  },
  created() {
    this.state = { nodes: [] };
  },
  buildRow(d) {
  	return [
      this.h('div',
             {
        style: {
          "margin-right": "4px",
          "font-weight": 600
        }
      },
      `${d.source.field}: `),
      this.h('div',
      	{},
        `${d.value}`)
    ];
  },
  buildNodes() {
    // Filter out any node that doesn't have any data bound to it or is a container node.
    // const shapes = this.state.nodes.filter(n => n.type !== 'container' && n.data);

    const shapes = this.state.nodes.filter(n => n.data);
    if (!shapes.length) {
      return [];
    }
    // Find an appropriate place to position the tooltip, lower right corner is good enough for now.
    const targetNode = shapes[shapes.length - 1];
    const left = targetNode.bounds.x + targetNode.bounds.width;
    const top = targetNode.bounds.y + targetNode.bounds.height;
    var rows=[];
    // Render each data property should be rendered on a separate row.
    if (targetNode._type=="container"){
    	rows.push(this.h('div',
	        {
	          style: {
	            display: 'flex'
	          }
	        },
	        this.buildRow(targetNode._data)
	        ))
    	rows.push(this.h('div',
	        {
	          style: {
	            display: 'flex'
	          }
	        },
	        this.buildRow(targetNode._data.end)
	        ))
	}
    else{	
	    rows = Object.keys(targetNode.data).filter(prop => prop !== 'value' && prop !== 'label').map(dataProp => {
	      return this.h('div',
	        {
	          style: {
	            display: 'flex'
	          }
	        },
	        this.buildRow(dataProp !== 'source' ? targetNode.data[dataProp] : targetNode.data)
	        )
	    });	
	}

    
    return [
      this.h('div', {
        style: {
          position: 'relative',
          left: `${left}px`,
          top: `${top}px`,
          background: this.settings.background,
          color: '#888',
          display: 'inline-block',
          "box-shadow": "0px 0px 5px 0px rgba(123, 123, 123, 0.5)",
          "border-radius": "5px",
          padding: '8px',
          "font-size": this.settings.fontSize,
          "font-family": 'Arial'
        }
      },
      rows)
    ];
  },
  // picasso.js uses snabbdom(https://github.com/snabbdom/snabbdom) for dom-manipulation and exposes the snabbdom helper function `h` as a parameter to the `render` function. We'll use `h` to render our tooltip, but as we don't need it right here, we'll store it in the context for later use.
  render(h) {
    this.h = h;
    return []; // Nothing to render initially so we return an empty array.
  }
})


picasso.component('select', {
  // The require property allows us to pull in our dependencies, in this case the chart instance for shape lookups and the renderer for rendering our nodes.
  require: ['chart', 'renderer'],
  // A component can define a set of default properties that expose in the current context. In our case we'll just allow some simple style related properties to be set by the users.
  defaultSettings: {
  	background: '#f9f9f9',
    fontSize: '12px'
  },
  // We require a particular type of renderer, the available once are svg/canvas/dom. Since we want to do be able do CSS layouting we'll use the dom-renderer. It's available in the context as `renderer`.
  renderer: 'dom',
  // zhu
  on: {
    select(app,e) {
	    const b = this.chart.element.getBoundingClientRect();
	    this.state.nodes = this.chart.shapesAt({
	      x: e.clientX - b.left,
	      y: e.clientY - b.top
	    });
	    app.getField(this.state.nodes[0]._data.source.field).then((result) => {
	    	result.select(this.state.nodes[0]._data.label)
	    })
    }
  },
  created() {
    this.state = { nodes: [] };
  },
  // picasso.js uses snabbdom(https://github.com/snabbdom/snabbdom) for dom-manipulation and exposes the snabbdom helper function `h` as a parameter to the `render` function. We'll use `h` to render our tooltip, but as we don't need it right here, we'll store it in the context for later use.
  render(h) {
    this.h = h;
    return []; // Nothing to render initially so we return an empty array.
  }
})

export default function (access_token,GUID){
      $.ajax({
        url: 'https://api.spotify.com/v1/me/top/tracks',
        headers: { 'Authorization': 'Bearer ' + access_token},
        data: { 
          limit: 20,
          time_range:'long_term'
        }
      }).done(function(trackData) {
        // console.log(trackData);
        //Spotify data loading and parsing
        var tempAlbums=[];
        var tempArtists=[];

        for (var i=0;i<trackData.items.length;i++) {
        	tempAlbums.push(trackData.items[i].album.id);
          	tempArtists.push(trackData.items[i].artists[0].id);
        }

        var promises=[];
        promises.push($.ajax({
	        url: 'https://api.spotify.com/v1/albums',
	        headers: { 'Authorization': 'Bearer ' + access_token},
	        data:{ids: tempAlbums.toString()}
		}));
        promises.push($.ajax({
	        url: 'https://api.spotify.com/v1/artists',
	        headers: { 'Authorization': 'Bearer ' + access_token},
	        data:{ids: tempArtists.toString()}
		}));

        Promise.all(promises).then(function(values) {
        	//Consolidate data
		  	var tempAlbums=values[0].albums;
		  	var tempArtists=values[1].artists;
	        // console.log(tempAlbums)
	        // console.log(tempArtists)

	        var tracks=[];
	        var albums=[];
	        var artists=[];
        	var artistGenrePairs=[];
		 	for (var i=0;i<trackData.items.length;i++) {
				var tempReleaseYear = tempAlbums[i].release_date.substring(0,4);
		        tracks.push(new track(trackData.items[i].album.name,
		        						trackData.items[i].artists[0].name,
		        						trackData.items[i].duration_ms,
		        						trackData.items[i].name,
		        						trackData.items[i].popularity,
		        						i+1));
		        albums.push(new album(tempAlbums[i].name,
	          						tempAlbums[i].label,
	          						tempAlbums[i].images[0].url,
	          						tempReleaseYear,
	          						tempAlbums[i].popularity));
		        artists.push(new artist(tempArtists[i].name,
	          						tempArtists[i].followers.total,
	          						tempArtists[i].popularity,
	          						tempArtists[i].images[0].url));
		        for(var j=0; j<tempArtists[i].genres.length; j++){
		        	 artistGenrePairs.push(new artistGenre(tempArtists[i].name,
	          						tempArtists[i].genres[j]));
		        }
	        }

	        //Feed data to Qlik
	        let halyard = new Halyard();
	        var table1 = new Halyard.Table(tracks, 'tracks');
	        var table2 = new Halyard.Table(albums, 'albums');
	        var table3 = new Halyard.Table(artists, 'artists');
	        var table4 = new Halyard.Table(artistGenrePairs, 'artistGenrePairs');
	        halyard.addTable(table1);
	        halyard.addTable(table2);
	        halyard.addTable(table3);
	        halyard.addTable(table4);
	        // console.log(halyard.getScript());
	        var config = {
	          schema: qixSchema,
	          mixins: enigmaMixin,
	          url: "ws://ec2-13-229-48-8.ap-southeast-1.compute.amazonaws.com:19076/app/"+ GUID,
	        };


	        enigma.create(config).open().then((qix) => {
	          qix.createSessionAppUsingHalyard(halyard).then((result) =>{
	            const app = result;
	            $(window).bind("beforeunload", function() { 
	              app.close();
	              return confirm("Do you really want to close?"); 
	            })
	            document.getElementById('btn-clear').addEventListener('click', function(){
	            	app.clearAll();
	            }, false);
	            result.getAppLayout()
	              .then(() =>{
	              	//graph 1
	                result.createSessionObject(trackListProperty).then((model) => {
	                    const object = model;
	                    const update = () => object.getLayout().then((layout) => {
	                		var content = "<div style='height: 100%; width: 100%; overflow-y: auto;'><table>"
							content += '<tr>';
							for(j=0; j<layout.qHyperCube.qSize.qcx; j++){
							    content += '<th>' +  layout.qHyperCube.qDimensionInfo[j].qFallbackTitle + '</th>';
							}
							content += '</tr>';
							for(i=0; i<layout.qHyperCube.qSize.qcy; i++){
								content += '<tr>';
								for(j=0; j<layout.qHyperCube.qSize.qcx; j++){
								    content += '<td>' +  layout.qHyperCube.qDataPages[0].qMatrix[i][j].qText + '</td>';
								}
								content += '</tr>';
							}
							content += "</table></div>"
							$('#chart1').empty().append(content);
	                    });
	                    object.on('changed', update);
	                    $( window ).resize(update);
	                    object.on('changed', update);
	                    update();
	                  });
	              })
	              // Graph 1 ended
	              // Graph 2
	              result.createSessionObject(distributorPieProperty).then((model) => {
                    const object2 = model;
                    const update2 = () => object2.getLayout().then((layout) => {
                		// console.log(layout);
                		const data=fromQlikToMatrix(layout.qHyperCube);


						var components=([{
						      type: 'legend-cat',
						      scale: 'c'
						    },{
						      key: 'p',
						      type: 'pie',
						      data: {
						        extract: {
						          field: 'distributor',
						          props: {
						            num: { field: '=Count(name)' }
						          }
						        }
						      },
						      settings: {
						        slice: {
						          arc: { ref: 'num' },
						          fill: { scale: 'c' },
						          outerRadius: () => 0.9,
						          strokeWidth: 1,
						          stroke: 'rgba(255, 255, 255, 0.5)'
						        }
						      }
						    }])


						var settings=({
						    scales: {
						      c: {
						        data: { extract: { field: 'distributor' } }, type: 'color'
						      }
						    },components
						  })

                		components.push({
						  	key: 'tooltip',
							type: 'tooltip',
						  	background: 'white' // Override our default setting
						})
                		components.push({
						  	key: 'select',
							type: 'select',
						})

                		//zhu
						settings.interactions = [
						  {
						    type: 'native',
						    events: {
						      mousemove: function(e) {
						        this.chart.component('tooltip').emit('hover', e);
						      },
						      mousedown: function(e) {
						        this.chart.component('select').emit('select', app,e);
						      }
						    }
						  }
						]

                		picasso.chart({
						  element: document.querySelector('#chart2'),
						  data,
						  settings: settings
						})

					
                    });
                    object2.on('changed', update2);
                    $( window ).resize(update2);
                    object2.on('changed', update2);
                    update2();
                  });
	              // Graph 2 end
	              // Graph 3
	              result.createSessionObject(yearPopularityScatterProperty).then((model) => {
                    const object3 = model;
                    const update3 = () => object3.getLayout().then((layout) => {
                		// console.log(layout);
                		const data=fromQlikToMatrix(layout.qHyperCube);
                		for(var i=1;i<data[0].data.length;i++)
                		{
                			data[0].data[i][1]=parseInt(data[0].data[i][1])
                			data[0].data[i][2]=parseInt(data[0].data[i][2])
                		}

                		var components = ([{
						      key: 'y-axis',
						      type: 'axis',
						      scale: 'p',
						      dock: 'left'
						    },{
						      key: 'x-axis',
						      type: 'axis',
						      scale: 'r',
						      dock: 'bottom'
						    }, {
						      key: 'p',
						      type: 'point',
						      data: {
						        extract: {
						          field: 'name',
						          props: {
						            x: { field: '=(releaseYear)' },
						            y: { field: '=(popularity)' },
						            group: { field: 'name' }
						          }
						        }
						      },
						      settings: {
						        x: { scale: 'r' },
						        y: { scale: 'p' },
						        shape: 'circle',
						        size: 1,
						        strokeWidth: 1,
						        stroke: '#fff',
						        opacity: 0.8,
						        fill: { scale: 'col', ref: 'group' }
						      }
	                		}])

                		var settings=({
						    scales: {
						      c: {
						        data: { extract: { field: 'name' } }, type: 'color'
						      },
						      r: {
						        data: {
						          field: '=(releaseYear)'
						        },
						        expand: 0.2
						      },
						      p: {
						        data: {
						          field: '=(popularity)'
						        },
						        expand: 0.2,
						        invert: true
						      }
						    },
						    components: components
						})

                		components.push({
						  	key: 'tooltip',
							type: 'tooltip',
						  	background: 'white' // Override our default setting
						})

						settings.interactions = [
						  {
						    type: 'native',
						    events: {
						      mousemove: function(e) {
						        this.chart.component('tooltip').emit('hover', e);
						      }
						    }
						  }
						]

                		picasso.chart({
						  element: document.querySelector('#chart3'),
						  data,
						  settings: settings
						})
                    });
                    object3.on('changed', update3);
                    $( window ).resize(update3);
                    object3.on('changed', update3);
                    update3();
                  });
	              // Graph 3 end
	              // Graph 4
	              result.createSessionObject(durationBarProperty).then((model) => {
                    const object4 = model;
                    const update4 = () => object4.getLayout().then((layout) => {
                		const data=fromQlikToMatrix(layout.qHyperCube);
                		
                		for(var i=1;i<data[0].data.length;i++)
                		{
                			data[0].data[i][1]=parseInt(data[0].data[i][1])
                		}


                		var components = ([{
						      type: 'axis',
						      dock: 'left',
						      scale: 'y'
						    },{
						      type: 'axis',
						      dock: 'bottom',
						      scale: 't'
						    },{
						      key: 'bars',
						      type: 'box',
						      data: {
						        extract: {
						          field: 'name',
						          props: {
						            start: 0,
						            end: { field: '=(duration)' }
						          }
						        }
						      },
						      settings: {
						        major: { scale: 't' },
						        minor: { scale: 'y' },
						        box: {
						          fill: { scale: 'c', ref: 'end' }
						        }
						      }
						    }])

                		var settings = ({
						    scales: {
						      y: {
						        data: { field: '=(duration)' },
						        invert: true,
						      },
						      c: {
						        data: { field: '=(duration)' },
						        type: 'color'
						      },
						      t: { data: { extract: { field: 'name' } }, padding: 0.3 },
						    },
						    components: components
						  })

                		components.push({
						  	key: 'tooltip',
							type: 'tooltip',
						  	background: 'white' // Override our default setting
						})

						settings.interactions = [
						  {
						    type: 'native',
						    events: {
						      mousemove: function(e) {
						        this.chart.component('tooltip').emit('hover', e);
						      }
						    }
						  }
						]
					
                		picasso.chart({
						  element: document.querySelector('#chart4'),
						  data,
						  settings: settings
						})
                    });
                    object4.on('changed', update4);
                    $( window ).resize(update4);
                    object4.on('changed', update4);
                    update4();
                  });
	              // Graph 4 end
	          })
	        });


		});
      });
  }




function track(albumName, artistName, duration, name, popularity,rank) {
  this.albumName = albumName;
  this.artistName = artistName;
  this.duration = duration;
  this.name = name;
  this.popularity = popularity;
  this.rank=rank;
}
function artist(artistName,follower,artistPopularity,artistImage)
{
  this.artistName = artistName;
  this.follower=follower;
  this.artistPopularity=artistPopularity;
  this.artistImage=artistImage;
}
function artistGenre(artistName,genre)
{
  this.artistName=artistName;
  this.genre=genre;
}
function album(albumName,distributor,albumImage,releaseYear,albumPopularity)
{
  this.albumName=albumName;
  this.distributor=distributor;
  this.albumImage=albumImage;
  this.releaseYear=releaseYear;
  this.albumPopularity=albumPopularity;
}

function fromQlikToMatrix(qHyperCube){
	// console.log(qHyperCube);
  var arr = [];
  var tempArr=[]
  for (var i = 0; i < qHyperCube.qDimensionInfo.length; i++) {
  	tempArr.push(qHyperCube.qDimensionInfo[i].qFallbackTitle)
  }
  for (var i = 0; i < qHyperCube.qMeasureInfo.length; i++) {
  	tempArr.push(qHyperCube.qMeasureInfo[i].qFallbackTitle)
  }

  arr.push(tempArr);
  for (var i = 0; i < qHyperCube.qSize.qcy; i++) {
  	var tempArr=[]
  	for (var j = 0; j < qHyperCube.qSize.qcx; j++) {
	    tempArr.push(qHyperCube.qDataPages[0].qMatrix[i][j].qText);
	}
    arr.push(tempArr);
  }

  return [{
    type: 'matrix',
    data: arr
  }];
}

const trackListProperty = {
    qInfo: {
      qType: 'visualization',
      qId: '',
    },
    type: 'track-list',
    labels: true,
    qHyperCubeDef: {
      qDimensions: [{
        qDef: {
          qFieldDefs: ['rank'],
          qSortCriterias: [{
            qSortByNumeric: 1,
          }],
        },
      },
      {
        qDef: {
          qFieldDefs: ['name']
        },
      },
      {
        qDef: {
          qFieldDefs: ['artistName']
        },
      },
      {
        qDef: {
          qFieldDefs: ['duration']
        },
      },
      {
        qDef: {
          qFieldDefs: ['popularity']
        },
      },
      {
        qDef: {
          qFieldDefs: ['distributor']
        },
      }],
      qInitialDataFetch: [{
        qTop: 0, qHeight: 200, qLeft: 0, qWidth: 10,
      }],
      qSuppressZero: false,
      qSuppressMissing: true,
    },
};

const distributorPieProperty = {
    qInfo: {
      qType: 'visualization',
      qId: '',
    },
    type: 'distributor-pie',
    labels: true,
    qHyperCubeDef: {
      qDimensions: [{
        qDef: {
          qFieldDefs: ['distributor'],
          qSortCriterias: [{
            qSortByNumeric: 1,
          }],
        },
      }],
      qMeasures: [{
        qDef: {
          qDef: '=Count(name)'
        }
      }],
      qInitialDataFetch: [{
        qTop: 0, qHeight: 200, qLeft: 0, qWidth: 2,
      }],
      qSuppressZero: false,
      qSuppressMissing: true,
    },
};
const yearPopularityScatterProperty = {
    qInfo: {
      qType: 'visualization',
      qId: '',
    },
    type: 'year-popularity-scatter',
    labels: true,
    qHyperCubeDef: {
      qDimensions: [{
        qDef: {
          qFieldDefs: ['name'],
          qSortCriterias: [{
            qSortByNumeric: 1,
          }],
        },
      }],
      qMeasures: [{
        qDef: {
          qDef: '=(releaseYear)'
        }
      },
      {
        qDef: {
          qDef: '=(popularity)'
        }
      }],
      qInitialDataFetch: [{
        qTop: 0, qHeight: 200, qLeft: 0, qWidth: 3,
      }],
      qSuppressZero: false,
      qSuppressMissing: true,
    },
};

const durationBarProperty = {
    qInfo: {
      qType: 'visualization',
      qId: '',
    },
    type: 'duration-bar',
    labels: true,
    qHyperCubeDef: {
      qDimensions: [{
        qDef: {
          qFieldDefs: ['name'],
          qSortCriterias: [{
            qSortByNumeric: 1,
          }],
        },
      }],
      qMeasures: [{
        qDef: {
          qDef: '=(duration)'
        }
      }],
      qInitialDataFetch: [{
        qTop: 0, qHeight: 200, qLeft: 0, qWidth: 3,
      }],
      qSuppressZero: false,
      qSuppressMissing: true,
    },
};